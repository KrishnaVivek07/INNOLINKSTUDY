import { CodingLab, MarketplaceProduct } from '../types';

export const INITIAL_CODING_LABS: CodingLab[] = [
  {
    id: 'lab-esp32-blink',
    courseId: 'course-electronics-core',
    moduleId: 'mod-core-1',
    lessonId: 'les-core-1',
    title: 'Lab 1: ESP32 GPIO Output & Digital Waveforms',
    description:
      'Learn fundamental microcontroller GPIO pin configuration, pull-up/pull-down physics, and timing delay oscillations using an ESP32 DevKit.',
    board: 'esp32',
    language: 'arduino_c',
    requiredComponents: ['ESP32 DevKit V1', 'Red LED 5mm', 'Resistor 220Ω', 'Half-size Breadboard', 'Jumper Wires'],
    instructions:
      '1. Connect the LED anode to ESP32 GPIO 2 via a 220Ω current-limiting resistor.\n2. Connect the cathode to GND.\n3. Write the pinMode and digitalWrite control routines in loop() with a 1000ms delay interval.\n4. Click "Compile & Check" then "Run Simulation".',
    expectedOutput:
      'LED toggles ON (HIGH / 3.3V) for 1000ms and OFF (LOW / 0V) for 1000ms with Serial baud rate at 115200.',
    startingCode: `// Innolink Technologies - Lab 1: ESP32 GPIO Output
const int LED_PIN = 2; // Onboard or external LED on GPIO 2

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Innolink ESP32 Laboratory Initialized.");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("GPIO 2 -> HIGH (LED ON)");
  delay(1000);

  digitalWrite(LED_PIN, LOW);
  Serial.println("GPIO 2 -> LOW (LED OFF)");
  delay(1000);
}`,
    startingBlocks:
      '<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup"><statement name="SETUP"><block type="serial_begin"><field name="BAUD">115200</field></block></statement><statement name="LOOP"><block type="digital_write"><field name="PIN">2</field><field name="STATE">HIGH</field><next><block type="delay_ms"><field name="MS">1000</field><next><block type="digital_write"><field name="PIN">2</field><field name="STATE">LOW</field><next><block type="delay_ms"><field name="MS">1000</field></block></next></block></next></block></next></block></statement></block></xml>',
    marks: 100,
    attemptsAllowed: 5,
    isPublished: true,
    recommendedKitId: 'kit-esp32-starter',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lab-arduino-button',
    courseId: 'course-electronics-core',
    moduleId: 'mod-core-2',
    lessonId: 'les-core-2',
    title: 'Lab 2: Arduino Uno Digital Input & Hardware Debouncing',
    description:
      'Interface a tactile push-button with internal pull-up resistor on Arduino Uno pin D2 to trigger active LED illumination on pin D13.',
    board: 'arduino_uno',
    language: 'arduino_c',
    requiredComponents: ['Arduino Uno R3', 'Tactile Push Button', 'Green LED', 'Resistor 330Ω', 'Breadboard'],
    instructions:
      '1. Configure Pin 2 with INPUT_PULLUP.\n2. Configure Pin 13 as OUTPUT.\n3. Read the digital pin value; when the button is pressed, the circuit pulls LOW, illuminating the LED.',
    expectedOutput:
      'Pressing the virtual push button illuminates the LED on pin 13 and prints state change to Serial monitor.',
    startingCode: `// Innolink Technologies - Lab 2: Arduino Digital Input
const int BUTTON_PIN = 2;
const int LED_PIN = 13;

void setup() {
  Serial.begin(9600);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Arduino Digital Input Lab Ready.");
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);

  if (buttonState == LOW) { // Button pressed (active-low)
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Button PRESSED -> LED ON");
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println("Button RELEASED -> LED OFF");
  }
  delay(100);
}`,
    marks: 100,
    attemptsAllowed: 5,
    isPublished: true,
    recommendedKitId: 'kit-arduino-core',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lab-pico-micropython',
    courseId: 'course-electronics-core',
    moduleId: 'mod-core-2',
    title: 'Lab 3: Raspberry Pi Pico (RP2040) MicroPython Pulse & ADC',
    description:
      'Execute native MicroPython code on the dual-core RP2040 chip, reading an analog potentiometer on ADC0 (GPIO 26) and modulating PWM pulse on LED.',
    board: 'rp2040_pico',
    language: 'micropython',
    requiredComponents: ['Raspberry Pi Pico RP2040', '10kΩ Potentiometer', 'PWM LED', 'Breadboard'],
    instructions:
      '1. Import Pin, ADC, PWM from machine library.\n2. Map ADC(26) to read 16-bit analog voltage (0-65535).\n3. Map PWM(Pin(25)) to adjust brightness dynamically.\n4. Observe voltage telemetric readings in the Python REPL.',
    expectedOutput:
      'MicroPython REPL prints 16-bit ADC voltage conversions while PWM duty cycle updates smoothly.',
    startingCode: `# Innolink Technologies - Lab 3: Raspberry Pi Pico (RP2040) MicroPython
from machine import Pin, ADC, PWM
import time

print("RP2040 Pico Initializing MicroPython VM...")

# Onboard LED or external PWM pin
led_pwm = PWM(Pin(25))
led_pwm.freq(1000)

adc_pot = ADC(Pin(26)) # ADC0 channel

print("Reading ADC potentiometer input. Rotating knob modulates duty cycle.")

for step in range(20):
    val_16bit = adc_pot.read_u16()
    voltage = (val_16bit / 65535.0) * 3.3
    led_pwm.duty_u16(val_16bit)
    print(f"ADC Value: {val_16bit} | Voltage: {voltage:.2f}V")
    time.sleep(0.5)

print("RP2040 Test Cycle Complete.")`,
    marks: 100,
    attemptsAllowed: 3,
    isPublished: true,
    recommendedKitId: 'kit-pico-lab',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lab-hybrid-traffic',
    courseId: 'course-electronics-core',
    moduleId: 'mod-core-1',
    title: 'Lab 4: Hybrid Visual Blocks ↔ C++ Traffic Signal Controller',
    description:
      'Build a three-phase intersection controller (Red, Yellow, Green) using visual logic blocks, and inspect the real-time generated C++ firmware.',
    board: 'esp32',
    language: 'hybrid',
    requiredComponents: ['ESP32 DevKit', 'Red LED', 'Yellow LED', 'Green LED', '3x 220Ω Resistors'],
    instructions:
      '1. Drag "Set LED (Red) ON", "Wait 3000ms", "Set LED (Yellow) ON", "Wait 1000ms", "Set LED (Green) ON" blocks.\n2. Observe the C++ code update live in the right editor.\n3. Verify loop execution timing and serial diagnostics.',
    expectedOutput: 'Sequential cyclic progression of Red (3s) -> Yellow (1s) -> Green (3s) traffic pattern.',
    startingCode: `// Innolink Technologies - Generated from Visual Hybrid Blocks
const int PIN_RED = 15;
const int PIN_YELLOW = 2;
const int PIN_GREEN = 4;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_YELLOW, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  Serial.println("Traffic Controller State Machine Booted.");
}

void loop() {
  // 1. RED Phase
  digitalWrite(PIN_RED, HIGH);
  digitalWrite(PIN_YELLOW, LOW);
  digitalWrite(PIN_GREEN, LOW);
  Serial.println("State: RED (Stop)");
  delay(3000);

  // 2. YELLOW Phase
  digitalWrite(PIN_RED, LOW);
  digitalWrite(PIN_YELLOW, HIGH);
  digitalWrite(PIN_GREEN, LOW);
  Serial.println("State: YELLOW (Prepare)");
  delay(1000);

  // 3. GREEN Phase
  digitalWrite(PIN_RED, LOW);
  digitalWrite(PIN_YELLOW, LOW);
  digitalWrite(PIN_GREEN, HIGH);
  Serial.println("State: GREEN (Proceed)");
  delay(3000);
}`,
    startingBlocks:
      '<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup"><statement name="LOOP"><block type="digital_write"><field name="PIN">15</field><field name="STATE">HIGH</field><next><block type="delay_ms"><field name="MS">3000</field><next><block type="digital_write"><field name="PIN">2</field><field name="STATE">HIGH</field></block></next></block></next></block></statement></block></xml>',
    marks: 100,
    attemptsAllowed: 5,
    isPublished: true,
    recommendedKitId: 'kit-esp32-starter',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lab-ultrasonic-distance',
    courseId: 'course-electronics-core',
    moduleId: 'mod-core-2',
    title: 'Lab 5: HC-SR04 Ultrasonic Distance Sensor & Speed of Sound',
    description:
      'Trigger 10μs ultrasonic pulses and calculate obstacle distance in centimeters using acoustic propagation delay equations.',
    board: 'arduino_uno',
    language: 'arduino_c',
    requiredComponents: ['Arduino Uno R3', 'HC-SR04 Ultrasonic Sensor', 'Breadboard', 'Jumper Wires'],
    instructions:
      '1. Connect TRIG to Pin 9 and ECHO to Pin 10.\n2. Emit a 10-microsecond trigger pulse.\n3. Measure echo return duration with pulseIn().\n4. Calculate distance = (duration * 0.0343) / 2.',
    expectedOutput:
      'Serial monitor streams live distance measurements in centimeters matching the simulation slider.',
    startingCode: `// Innolink Technologies - Lab 5: Ultrasonic Rangefinder
const int TRIG_PIN = 9;
const int ECHO_PIN = 10;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.println("HC-SR04 Ultrasonic Distance Sensor Initialized.");
}

void loop() {
  // Clear trigger
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  // Send 10us HIGH pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Read echo reflection pulse width (microseconds)
  long duration = pulseIn(ECHO_PIN, HIGH);

  // Calculate distance in cm (Speed of sound = 343 m/s = 0.0343 cm/us)
  float distanceCm = (duration * 0.0343) / 2.0;

  Serial.print("Distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");

  delay(500);
}`,
    marks: 100,
    attemptsAllowed: 5,
    isPublished: true,
    recommendedKitId: 'kit-sensors-master',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'kit-esp32-starter',
    sellerId: 'seller-innolink-official',
    sellerName: 'Innolink Hardware Lab Division',
    title: 'Innolink ESP32 Ultimate IoT & Robotics Starter Kit',
    description:
      'Complete hands-on electronics kit specifically designed for the Innolink Technologies Hardware Curriculum. Includes authentic ESP32 DevKit V1 with dual-core Xtensa LX6 processors, Wi-Fi, Bluetooth BLE, 40+ sensors, OLED display, servo motors, breadboard, and pre-cut jumper wires in a rugged organizer case.',
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'esp32',
    boardPlatform: 'esp32',
    price: 2499,
    discountPercent: 15,
    stock: 45,
    sku: 'INNO-KIT-ESP32-V1',
    componentsIncluded: [
      'ESP32 NodeMCU DevKit V1 (30-pin, CP2102)',
      '0.96" I2C OLED Display (128x64 Blue/Yellow)',
      'SG90 Micro Servo Motor with horns',
      'HC-SR04 Ultrasonic Distance Sensor',
      'DHT11 Temperature & Relative Humidity Sensor',
      'Active & Passive Piezo Buzzers',
      'LDR Light Sensor Modules (2x)',
      'RGB SMD LED Module + 20x Assorted 5mm LEDs',
      '120x Metal Film Resistors (220Ω, 1kΩ, 10kΩ, 100kΩ)',
      '830-Point Solderless Breadboard with power rails',
      '65x Flexible Male-to-Male Jumper Wires',
      'USB-to-MicroUSB High-Speed Data Cable',
    ],
    specifications: {
      Microcontroller: 'ESP32-WROOM-32 32-bit Dual Core 240MHz',
      'Wireless Connectivity': 'Wi-Fi 802.11 b/g/n + Bluetooth 4.2 BLE',
      'Operating Voltage': '3.3V Logic / 5V USB Power Supply',
      SRAM: '520 KB',
      'Flash Memory': '4 MB SPI Flash',
      'GPIO Pins': '25 Multiplexed I/O Pins (PWM, ADC, DAC, I2C, SPI)',
    },
    skillLevel: 'Beginner',
    recommendedAge: '12+ years / University Engineering',
    warranty: '1 Year Full Replacement Warranty on ESP32 Core',
    shippingInfo: 'Dispatched within 24 hours. Express courier shipping across India.',
    isApproved: true,
    rating: 4.9,
    reviewCount: 42,
    status: 'approved',
    relatedCourseId: 'course-electronics-core',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'kit-arduino-core',
    sellerId: 'seller-innolink-official',
    sellerName: 'Innolink Hardware Lab Division',
    title: 'Innolink Arduino Uno R3 Comprehensive Engineering Lab Kit',
    description:
      'The definitive electronics beginner-to-expert kit featuring the ATmega328P Arduino Uno R3 board. Designed for students taking the introductory and intermediate circuitry modules at Innolink Technologies.',
    images: ['https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=1000&q=80'],
    category: 'arduino',
    boardPlatform: 'arduino',
    price: 1899,
    discountPercent: 10,
    stock: 60,
    sku: 'INNO-KIT-UNO-R3',
    componentsIncluded: [
      'Arduino Uno R3 Compatible Board (DIP ATmega328P + 16U2)',
      '16x2 Character LCD with I2C Backlight Adapter',
      '10kΩ Rotary Precision Potentiometers (2x)',
      '5V DC Relay Module with optocoupler isolation',
      'PIR Motion Detection Sensor',
      '5x Tactile Push Buttons with colorful round caps',
      '9V Battery Clip with 2.1mm DC Barrel Jack',
      'Breadboard Power Supply Module (Dual 3.3V / 5V Rails)',
      'Component Storage Box with Dividers',
    ],
    specifications: {
      Microcontroller: 'ATmega328P (8-bit AVR 16 MHz)',
      'Operating Voltage': '5V DC',
      'Digital I/O Pins': '14 (of which 6 provide PWM output)',
      'Analog Input Pins': '6 (10-bit ADC resolution)',
      'Flash Memory': '32 KB (0.5 KB used by bootloader)',
    },
    skillLevel: 'Beginner',
    recommendedAge: '10+ years',
    warranty: '6 Months Manufacturer Guarantee',
    shippingInfo: 'Fast dispatch from regional hub. Free shipping on orders over ₹999.',
    isApproved: true,
    rating: 4.8,
    reviewCount: 38,
    status: 'approved',
    relatedCourseId: 'course-electronics-core',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'kit-pico-lab',
    sellerId: 'seller-innolink-official',
    sellerName: 'Innolink Hardware Lab Division',
    title: 'Innolink Raspberry Pi Pico (RP2040) Embedded MicroPython Lab Pack',
    description:
      'Master dual-core ARM Cortex-M0+ silicon with Raspberry Pi Pico. Pre-soldered header pins for instant breadboard prototyping, pre-loaded with MicroPython UF2 firmware, accompanied by precision sensors and I2C peripherals.',
    images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'],
    category: 'pico',
    boardPlatform: 'rp2040_pico',
    price: 1499,
    discountPercent: 5,
    stock: 30,
    sku: 'INNO-KIT-PICO-RP2040',
    componentsIncluded: [
      'Raspberry Pi Pico Board with Pre-Soldered Gold Headers',
      '0.91" I2C White OLED Display',
      'Rotary Encoder with Push Switch',
      '3-Axis Accelerometer (MPU6050 Gyro + Accel)',
      'Micro-USB High-Speed Debug Cable',
      '400-Point Half Breadboard',
      'Set of 30x DuPont Male-to-Female Wires',
    ],
    specifications: {
      Silicon: 'RP2040 Dual ARM Cortex-M0+ @ 133MHz',
      Memory: '264 KB On-chip SRAM, 2 MB QSPI Flash',
      'Programmable I/O': '8x Programmable I/O (PIO) state machines for custom peripheral support',
      ADC: '3x 12-bit ADC channels',
    },
    skillLevel: 'Intermediate',
    recommendedAge: '14+ years',
    warranty: '1 Year Warranty',
    shippingInfo: 'Standard delivery 2-4 business days.',
    isApproved: true,
    rating: 4.9,
    reviewCount: 29,
    status: 'approved',
    relatedCourseId: 'course-electronics-core',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'kit-robotics-car',
    sellerId: 'seller-innolink-official',
    sellerName: 'Innolink Robotics Lab',
    title: 'Innolink Autonomous 4WD Obstacle-Avoiding & Bluetooth Robot Car Kit',
    description:
      'Build and program a physical mobile robot with dual differential gearmotors, L298N dual H-bridge motor driver, ultrasonic sensor servo scanning bracket, and infrared line-tracking arrays.',
    images: ['https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=80'],
    category: 'robotics',
    boardPlatform: 'robotics',
    price: 3799,
    discountPercent: 20,
    stock: 22,
    sku: 'INNO-ROBOT-4WD-CAR',
    componentsIncluded: [
      'Dual-Layer Acrylic Robot Chassis with mounting hardware',
      '4x TT Gearmotors with high-grip rubber tires',
      'L298N Dual Motor Driver Controller Board',
      'HC-05 Wireless Bluetooth SPP Module',
      'HC-SR04 Ultrasonic Distance Sensor with Pan-Tilt Servo Mount',
      '3-Channel Infrared TCRT5000 Line Tracker Board',
      'Rechargeable 18650 Dual Battery Holder with Safety Switch',
      'Assembly Tool Set (Screwdriver, Spacers, Nuts & Bolts)',
    ],
    specifications: {
      'Chassis Dimensions': '255mm x 160mm x 60mm',
      'Operating Voltage': '6V - 12V DC Battery Pack',
      'Drive System': '4-Wheel Independent Drive with reduction gearboxes',
      'Control Modes': 'Autonomous Obstacle Avoidance, Line Tracking, Bluetooth Remote Mobile App',
    },
    skillLevel: 'Intermediate',
    recommendedAge: '12+ years',
    warranty: '6 Months Mechanical & Electronic Warranty',
    shippingInfo: 'Insured parcel delivery with live tracking.',
    isApproved: true,
    rating: 5.0,
    reviewCount: 54,
    status: 'approved',
    relatedCourseId: 'course-electronics-core',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'kit-sensors-master',
    sellerId: 'seller-innolink-official',
    sellerName: 'Innolink Hardware Lab Division',
    title: 'Innolink 37-in-1 Sensor Modules & Transducer Master Kit',
    description:
      'An exhaustive laboratory inventory of 37 analog and digital sensor modules for embedded systems, Internet of Things, telemetry, and automated environmental monitoring.',
    images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'],
    category: 'sensors',
    boardPlatform: 'universal',
    price: 2199,
    discountPercent: 12,
    stock: 50,
    sku: 'INNO-SENSORS-37IN1',
    componentsIncluded: [
      'Analog Sound / Microphone Sensor',
      'Obstacle Avoidance IR Sensor',
      'Flame / Fire Detection Optical Sensor',
      'Soil Moisture Hygrometer Sensor + Probe',
      'MQ-2 Flammable Gas & Smoke Sensor',
      'DS18B20 Waterproof Temperature Sensor',
      'BMP280 Digital Barometric Pressure & Altitude Sensor',
      'Vibration / Knock Sensor',
      'Hall Effect Magnetic Field Sensor',
      'Heavy-duty Clear Plastic Tool Case',
    ],
    specifications: {
      'Signal Output': 'Both Analog (0-VCC) and Digital TTL (High/Low via onboard LM393 comparators)',
      'Voltage Compatibility': '3.3V and 5V Compatible with ESP32, Arduino, and Pico',
    },
    skillLevel: 'Beginner',
    recommendedAge: 'All ages',
    warranty: '1 Year Warranty',
    shippingInfo: 'In stock. Ships today.',
    isApproved: true,
    rating: 4.8,
    reviewCount: 31,
    status: 'approved',
    relatedCourseId: 'course-electronics-core',
    createdAt: new Date().toISOString(),
  },
];
