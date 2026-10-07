import { HardwareBoard, SimulatedComponent } from '../types';
import { BOARD_REGISTRY } from './boardRegistry';

export interface SimulationDiagnostic {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  componentId?: string;
  suggestion?: string;
}

export interface CircuitValidationResult {
  isValid: boolean;
  diagnostics: SimulationDiagnostic[];
  activeOutputs: {
    leds: Record<string, { state: boolean; brightness: number; color?: string }>;
    buzzers: Record<string, { active: boolean; frequency: number }>;
    servos: Record<string, { angle: number }>;
    lcds: Record<string, { line1: string; line2: string }>;
  };
}

export function validateAndSimulateCircuit(
  boardId: string,
  components: SimulatedComponent[],
  isFirmwareRunning: boolean
): CircuitValidationResult {
  const board = BOARD_REGISTRY[boardId] || BOARD_REGISTRY.arduino_uno;
  const diagnostics: SimulationDiagnostic[] = [];
  const validPins = new Set([
    ...board.availablePins.map((p) => p.id),
    ...board.availablePins.map((p) => p.id.toLowerCase()),
    ...board.availablePins.map((p) => p.id.replace(/^GPIO|^GP/i, '')),
  ]);

  // Check 1: Empty circuit check
  if (components.length === 0) {
    return {
      isValid: true,
      diagnostics: [
        {
          type: 'info',
          code: 'INFO_EMPTY_BREADBOARD',
          message: 'Workspace is ready. Drag components from the left library onto the canvas to build your circuit.',
        },
      ],
      activeOutputs: { leds: {}, buzzers: {}, servos: {}, lcds: {} },
    };
  }

  // Check 2: Short circuit detection
  const hasDirectShort = components.some(
    (c) =>
      c.pins &&
      c.pins.vcc &&
      c.pins.gnd &&
      c.pins.vcc.toLowerCase() === c.pins.gnd.toLowerCase()
  );
  if (hasDirectShort) {
    diagnostics.push({
      type: 'error',
      code: 'ERR_SHORT_CIRCUIT',
      message: 'CRITICAL ERROR: Short circuit detected! Power rail is connected directly to Ground.',
      suggestion: 'Disconnect the direct bridge between VCC/5V/3.3V and GND.',
    });
  }

  // Check 3: Component ground & pin connections
  let hasCommonGround = true;
  const hasResistorInCircuit = components.some((c) => c.type === 'resistor');

  components.forEach((comp) => {
    const assignedPin = comp.state?.pin?.toString() || comp.pins?.signal || '';

    // Check if component's signal pin is valid for this board
    if (assignedPin && !validPins.has(assignedPin)) {
      diagnostics.push({
        type: 'error',
        code: 'ERR_INVALID_PIN',
        message: `Pin "${assignedPin}" assigned to ${comp.label} is not a valid hardware pin on ${board.name}.`,
        componentId: comp.id,
        suggestion: `Select an available pin from the ${board.name} pinout (e.g. ${board.availablePins.slice(0, 4).map((p) => p.name).join(', ')}).`,
      });
    }

    // Check LED specific rules
    if (comp.type === 'led' || comp.type === 'rgb_led') {
      if (!assignedPin) {
        diagnostics.push({
          type: 'error',
          code: 'ERR_LED_UNCONNECTED',
          message: `${comp.label} has no GPIO pin assigned. It cannot be controlled.`,
          componentId: comp.id,
          suggestion: 'Assign a digital or PWM pin in the component controls.',
        });
      }

      // Check current limiting resistor warning
      if (!hasResistorInCircuit) {
        diagnostics.push({
          type: 'warning',
          code: 'WARN_NO_RESISTOR',
          message: `WARNING: ${comp.label} is operating without a 220Ω - 330Ω current-limiting resistor. In physical hardware, the LED may burn out.`,
          componentId: comp.id,
          suggestion: 'Add a 220Ω resistor in series between the GPIO pin and the LED anode.',
        });
      }
    }

    // Check I2C display devices
    if (comp.type === 'lcd_16x2' || comp.type === 'oled_i2c') {
      const i2cPins = board.availablePins.filter((p) => p.type === 'i2c');
      if (i2cPins.length === 0) {
        diagnostics.push({
          type: 'warning',
          code: 'WARN_I2C_UNSUPPORTED',
          message: `${board.name} does not specify dedicated hardware I2C pins. Software wire emulation will be used.`,
          componentId: comp.id,
        });
      }
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
          line2: `Running Simulation...`,
        };
      }
    });
  }

  return {
    isValid: !hasCriticalErrors,
    diagnostics,
    activeOutputs,
  };
}
