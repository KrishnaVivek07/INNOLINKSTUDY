import { HardwareBoard, SimulatedComponent, CircuitWire } from '../types';
import { BOARD_REGISTRY } from './boardRegistry';

export interface SimulationDiagnostic {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  componentId?: string;
  pinId?: string;
  suggestion?: string;
}

export interface CircuitValidationResult {
  isValid: boolean;
  diagnostics: SimulationDiagnostic[];
  connectedNets: Record<string, string[]>; // netId -> list of node identifiers
  activeOutputs: {
    leds: Record<string, { state: boolean; brightness: number; color?: string; reversed?: boolean }>;
    buzzers: Record<string, { active: boolean; frequency: number }>;
    servos: Record<string, { angle: number }>;
    lcds: Record<string, { line1: string; line2: string }>;
  };
}

/**
 * Resolves a breadboard hole ID into its internal electrical tie-point net.
 * Half-size solderless breadboard layout:
 * - Top rails: 'bb-rail-top-plus-*', 'bb-rail-top-minus-*'
 * - Bottom rails: 'bb-rail-bot-plus-*', 'bb-rail-bot-minus-*'
 * - Terminal rows 1 to 30:
 *   - 'bb-row-{N}-[a-e]' are tied together (top section)
 *   - 'bb-row-{N}-[f-j]' are tied together (bottom section)
 */
export function getBreadboardInternalNet(holeId: string): string {
  if (!holeId || !holeId.startsWith('bb-')) return holeId;

  if (holeId.includes('rail-top-plus') || holeId.includes('rail-top-vcc')) return 'NET_BB_RAIL_TOP_VCC';
  if (holeId.includes('rail-top-minus') || holeId.includes('rail-top-gnd')) return 'NET_BB_RAIL_TOP_GND';
  if (holeId.includes('rail-bot-plus') || holeId.includes('rail-bot-vcc')) return 'NET_BB_RAIL_BOT_VCC';
  if (holeId.includes('rail-bot-minus') || holeId.includes('rail-bot-gnd')) return 'NET_BB_RAIL_BOT_GND';

  const matchTop = holeId.match(/bb-row-(\d+)-[a-e]/i);
  if (matchTop) return `NET_BB_ROW_${matchTop[1]}_TOP`;

  const matchBot = holeId.match(/bb-row-(\d+)-[f-j]/i);
  if (matchBot) return `NET_BB_ROW_${matchBot[1]}_BOT`;

  return holeId;
}

class DisjointSet {
  parent: Map<string, string> = new Map();

  find(item: string): string {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
      return item;
    }
    const p = this.parent.get(item)!;
    if (p !== item) {
      const root = this.find(p);
      this.parent.set(item, root);
      return root;
    }
    return item;
  }

  union(a: string, b: string) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }

  getGroups(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(key);
    }
    return groups;
  }
}

export function validateAndSimulateCircuit(
  boardId: string,
  components: SimulatedComponent[],
  isFirmwareRunning: boolean,
  wires: CircuitWire[] = []
): CircuitValidationResult {
  const board = BOARD_REGISTRY[boardId] || BOARD_REGISTRY.arduino_uno;
  const diagnostics: SimulationDiagnostic[] = [];
  const validPins = new Set([
    ...board.availablePins.map((p) => p.id),
    ...board.availablePins.map((p) => p.id.toLowerCase()),
    ...board.availablePins.map((p) => p.id.replace(/^GPIO|^GP/i, '')),
  ]);

  // Build Netlist Graph using DisjointSet
  const dsu = new DisjointSet();

  // 1. Add direct wires
  wires.forEach((wire) => {
    let fromNode = '';
    let toNode = '';

    if (wire.from.type === 'board') {
      fromNode = `BOARD_${wire.from.pinId.toUpperCase()}`;
    } else if (wire.from.type === 'breadboard') {
      fromNode = getBreadboardInternalNet(wire.from.pinId);
    } else if (wire.from.type === 'component') {
      fromNode = `COMP_${wire.from.componentId}_${wire.from.pinId}`;
    }

    if (wire.to.type === 'board') {
      toNode = `BOARD_${wire.to.pinId.toUpperCase()}`;
    } else if (wire.to.type === 'breadboard') {
      toNode = getBreadboardInternalNet(wire.to.pinId);
    } else if (wire.to.type === 'component') {
      toNode = `COMP_${wire.to.componentId}_${wire.to.pinId}`;
    }

    if (fromNode && toNode) {
      dsu.union(fromNode, toNode);
    }
  });

  // 2. Connect components pins based on comp.pins map (for backwards compatibility and direct pin assignment)
  components.forEach((comp) => {
    if (comp.pins) {
      Object.entries(comp.pins).forEach(([pinKey, targetVal]) => {
        if (!targetVal) return;
        const compNode = `COMP_${comp.id}_${pinKey}`;
        let targetNode = '';
        if (targetVal.startsWith('bb-')) {
          targetNode = getBreadboardInternalNet(targetVal);
        } else {
          targetNode = `BOARD_${targetVal.toUpperCase()}`;
        }
        dsu.union(compNode, targetNode);
      });
    }
  });

  // Helper: check if two nodes share the same net
  const areConnected = (nodeA: string, nodeB: string): boolean => {
    return dsu.find(nodeA) === dsu.find(nodeB);
  };

  // Helper: find which board pin a given component pin connects to
  const getConnectedBoardPins = (node: string): string[] => {
    const root = dsu.find(node);
    const connected: string[] = [];
    for (const pin of board.availablePins) {
      const bNode = `BOARD_${pin.id.toUpperCase()}`;
      if (dsu.find(bNode) === root) {
        connected.push(pin.id);
      }
    }
    return connected;
  };

  // Check 1: Empty circuit check
  if (components.length === 0 && wires.length === 0) {
    return {
      isValid: true,
      diagnostics: [
        {
          type: 'info',
          code: 'INFO_EMPTY_BREADBOARD',
          message: 'Workspace is ready. Drag components from the library or load a starter project to begin.',
        },
      ],
      connectedNets: {},
      activeOutputs: { leds: {}, buzzers: {}, servos: {}, lcds: {} },
    };
  }

  // Check 2: Critical Short Circuit Detection (Power to Ground)
  const powerNodes = ['BOARD_5V', 'BOARD_3V3', 'BOARD_3.3V', 'BOARD_VIN'];
  const groundNodes = ['BOARD_GND', 'BOARD_GROUND'];
  let isShortCircuited = false;

  for (const pNode of powerNodes) {
    for (const gNode of groundNodes) {
      if (dsu.parent.has(pNode) && dsu.parent.has(gNode) && areConnected(pNode, gNode)) {
        isShortCircuited = true;
        diagnostics.push({
          type: 'error',
          code: 'ERR_SHORT_CIRCUIT',
          message: 'CRITICAL SHORT CIRCUIT: Power rail (5V / 3.3V) is connected directly to Ground!',
          suggestion: 'Disconnect the direct wire bridging VCC and GND to prevent hardware destruction.',
        });
        break;
      }
    }
    if (isShortCircuited) break;
  }

  // Check 3: Check individual components
  const hasResistorInCircuit = components.some((c) => c.type === 'resistor');

  components.forEach((comp) => {
    // LED checks
    if (comp.type === 'led') {
      const anodeNode = `COMP_${comp.id}_anode`;
      const cathodeNode = `COMP_${comp.id}_cathode`;

      const anodeBoardPins = getConnectedBoardPins(anodeNode);
      const cathodeBoardPins = getConnectedBoardPins(cathodeNode);

      const anodeToGnd = cathodeBoardPins.length === 0 && anodeBoardPins.some((p) => p.toUpperCase() === 'GND');
      const cathodeToPos = cathodeBoardPins.some((p) => p !== 'GND');

      // Check reverse polarity
      if (anodeToGnd && cathodeToPos) {
        diagnostics.push({
          type: 'error',
          code: 'ERR_LED_REVERSED',
          message: `${comp.label}: Reversed Polarity detected! Cathode (-) is wired to positive supply while Anode (+) is connected to Ground.`,
          componentId: comp.id,
          suggestion: 'Invert the LED pins: Connect the longer lead (Anode) to the GPIO/resistor and the flat side (Cathode) to GND.',
        });
      }

      // Check missing GND
      const hasGnd = cathodeBoardPins.some((p) => p.toUpperCase() === 'GND') ||
        (comp.pins?.cathode && comp.pins.cathode.toUpperCase() === 'GND');

      if (!hasGnd && wires.length > 0) {
        diagnostics.push({
          type: 'warning',
          code: 'WARN_LED_NO_GND',
          message: `${comp.label}: Cathode lead (-) is not connected to Ground (GND).`,
          componentId: comp.id,
          suggestion: 'Connect a black jumper wire from the LED cathode to the breadboard GND rail.',
        });
      }

      // Check missing resistor
      if (!hasResistorInCircuit) {
        diagnostics.push({
          type: 'warning',
          code: 'WARN_NO_RESISTOR',
          message: `WARNING: ${comp.label} is operating without a current-limiting resistor (220Ω - 330Ω).`,
          componentId: comp.id,
          suggestion: 'Place a 220Ω resistor in series with the LED to protect the LED and GPIO output driver.',
        });
      }
    }

    // Ultrasonic Sensor checks
    if (comp.type === 'ultrasonic_sensor') {
      const trigPin = comp.pins?.trig || comp.pins?.signal;
      const echoPin = comp.pins?.echo;
      if (trigPin && echoPin && trigPin === echoPin) {
        diagnostics.push({
          type: 'error',
          code: 'ERR_ULTRASONIC_PIN_CONFLICT',
          message: `${comp.label}: Trig and Echo cannot share the exact same GPIO pin (${trigPin}).`,
          componentId: comp.id,
          suggestion: 'Assign separate digital pins for Trig (e.g. Pin 9) and Echo (e.g. Pin 10).',
        });
      }
    }

    // Check invalid pin assignment
    const assignedPin = comp.state?.pin?.toString() || comp.pins?.signal || comp.pins?.anode || '';
    if (assignedPin && !assignedPin.startsWith('bb-') && !validPins.has(assignedPin)) {
      diagnostics.push({
        type: 'error',
        code: 'ERR_INVALID_PIN',
        message: `Pin "${assignedPin}" configured for ${comp.label} is not a valid hardware pin on ${board.name}.`,
        componentId: comp.id,
        suggestion: `Select an available pin from the ${board.name} pinout (e.g. ${board.availablePins.slice(0, 4).map((p) => p.name).join(', ')}).`,
      });
    }
  });

  const hasCriticalErrors = diagnostics.some((d) => d.type === 'error');

  // Compute active simulation outputs
  const activeOutputs: CircuitValidationResult['activeOutputs'] = {
    leds: {},
    buzzers: {},
    servos: {},
    lcds: {},
  };

  if (isFirmwareRunning && !hasCriticalErrors) {
    components.forEach((comp) => {
      if (comp.type === 'led') {
        const isDigitalHigh = comp.state?.digitalValue ?? true;
        const analogVal = comp.state?.analogValue ?? 255;
        activeOutputs.leds[comp.id] = {
          state: isDigitalHigh,
          brightness: isDigitalHigh ? Math.min(100, Math.round((analogVal / 255) * 100)) : 0,
          color: comp.color || 'red',
        };
      } else if (comp.type === 'buzzer') {
        const isBuzzerActive = comp.state?.digitalValue ?? true;
        activeOutputs.buzzers[comp.id] = {
          active: isBuzzerActive,
          frequency: 1000,
        };
      } else if (comp.type === 'servo') {
        activeOutputs.servos[comp.id] = {
          angle: comp.state?.angle ?? 90,
        };
      } else if (comp.type === 'lcd_16x2') {
        activeOutputs.lcds[comp.id] = {
          line1: comp.state?.text || `${board.name} Ready`,
          line2: `Simulating...`,
        };
      }
    });
  }

  if (diagnostics.length === 0) {
    diagnostics.push({
      type: 'info',
      code: 'INFO_CIRCUIT_HEALTHY',
      message: `Circuit wiring verified. Hardware loop closed properly with ${board.name}.`,
    });
  }

  // Convert DSU groups to serializable map
  const connectedNets: Record<string, string[]> = {};
  const groups = dsu.getGroups();
  let netIdx = 1;
  groups.forEach((members, root) => {
    connectedNets[`NET_${netIdx++}`] = members;
  });

  return {
    isValid: !hasCriticalErrors,
    diagnostics,
    connectedNets,
    activeOutputs,
  };
}
