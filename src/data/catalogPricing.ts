export interface SubComponentOption {
  id: string;
  partNumber: string;
  partName: string;
  componentCategory: string;
  packageType: string;
  priceTiers: [number, number, number]; // e.g. [20, 30, 40]
  defaultTierIndex: number;
  extractionFeeInr: number;
  difficulty: 'LEVEL_1_PLUG_PULL' | 'LEVEL_2_BASIC_IRON' | 'LEVEL_3_HOT_AIR_SMD';
  recommendedTempC: number;
  bypassHackTip?: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  minPrice: number;
  maxPrice: number;
  recommendedPrice: number;
  quickFillChips: string[];
  subModels: string[];
  rawBoardPriceTiers: { price: number; label: string }[];
  defaultExtractionFeeInr: number;
  subComponents: SubComponentOption[];
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: 'IC_MICROCONTROLLERS',
    name: 'ICs & Microcontrollers',
    shortName: 'Dev Boards & ICs',
    description: 'Arduino, ESP32, STM32, Raspberry Pi Pico, and Academic Microcontroller Boards',
    icon: '◈',
    minPrice: 15,
    maxPrice: 250,
    recommendedPrice: 65,
    quickFillChips: [
      'Arduino Uno R3 (ATmega328P)',
      'ESP32 Wi-Fi + BLE Dev Board',
      'STM32F103 BluePill Board',
      'CH340G USB-TTL Interface IC',
      'AMS1117-3.3V Voltage Regulator',
      'Raspberry Pi Pico RP2040 Board'
    ],
    subModels: [
      'Arduino Uno R3 (ATmega328P)',
      'Arduino Nano (CH340G / FTDI)',
      'Arduino Mega 2560',
      'ESP32 NodeMCU DevKit v1',
      'ESP8266 NodeMCU v3 LoLin',
      'STM32F103C8T6 BluePill',
      'Raspberry Pi Pico (RP2040)',
      'Custom Academic / Final Year Project PCB'
    ],
    rawBoardPriceTiers: [
      { price: 30, label: 'Basic Scrap (Salvage 1-2 Parts)' },
      { price: 50, label: 'Standard Donor (Most Parts Intact)' },
      { price: 80, label: 'High-Yield Board (Only MCU/Power Fault)' }
    ],
    defaultExtractionFeeInr: 20,
    subComponents: [
      {
        id: 'ic-mcu',
        partNumber: 'ATMEGA328P / ESP32 / STM32',
        partName: 'Main Microcontroller IC',
        componentCategory: 'Microcontroller',
        packageType: 'DIP-28 / QFP-32 / Module',
        priceTiers: [45, 65, 90],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 320,
        bypassHackTip: 'Check crystal lines and 3.3V/5V rails before desoldering.'
      },
      {
        id: 'ic-usb-ttl',
        partNumber: 'CH340G / CP2102 / FT232R',
        partName: 'USB-to-Serial UART Converter IC',
        componentCategory: 'Interface IC',
        packageType: 'SOIC-16 / QFN-28',
        priceTiers: [20, 30, 40],
        defaultTierIndex: 0,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_3_HOT_AIR_SMD',
        recommendedTempC: 330,
        bypassHackTip: 'Cut 3.3V trace to dead MCU and repurpose board as a standalone USB-to-TTL programmer!'
      },
      {
        id: 'ic-ldo',
        partNumber: 'AMS1117-3.3 / AMS1117-5.0 / 7805',
        partName: 'LDO Linear Voltage Regulator',
        componentCategory: 'Power Management',
        packageType: 'SOT-223 / TO-220',
        priceTiers: [10, 15, 25],
        defaultTierIndex: 0,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 310,
        bypassHackTip: 'Bypass blown regulator by injecting regulated 3.3V or 5V directly into the rail.'
      },
      {
        id: 'ic-crystal',
        partNumber: '16.000MHz / 8.000MHz / 32.768kHz',
        partName: 'Crystal Oscillator / Ceramic Resonator',
        componentCategory: 'Clock / Crystal',
        packageType: 'HC-49S / SMD-3213',
        priceTiers: [8, 12, 18],
        defaultTierIndex: 0,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 300
      },
      {
        id: 'ic-flash',
        partNumber: 'W25Q32 / W25Q64 / AT24C256',
        partName: 'SPI Flash / I2C EEPROM Memory IC',
        componentCategory: 'Memory IC',
        packageType: 'SOIC-8 SMD',
        priceTiers: [15, 25, 35],
        defaultTierIndex: 1,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_3_HOT_AIR_SMD',
        recommendedTempC: 320
      },
      {
        id: 'ic-opamp',
        partNumber: 'LM358 / NE555 / LM393',
        partName: 'Dual Op-Amp / Precision Timer IC',
        componentCategory: 'Analog IC',
        packageType: 'DIP-8 / SOIC-8',
        priceTiers: [10, 15, 20],
        defaultTierIndex: 0,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 310
      },
      {
        id: 'ic-connectors',
        partNumber: 'USB Type-B/C + DC Barrel + Headers',
        partName: 'Connector & Hardware Header Set',
        componentCategory: 'Electromechanical',
        packageType: 'Through-Hole & SMD Set',
        priceTiers: [10, 15, 25],
        defaultTierIndex: 0,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 330
      }
    ]
  },
  {
    id: 'WASHING_MACHINE_APPLIANCE',
    name: 'Washing Machine & Home Appliance Parts',
    shortName: 'Home Appliances',
    description: 'Inverter boards, relays, pressure sensors, and pumps from washing machines & ACs',
    icon: '⚙',
    minPrice: 60,
    maxPrice: 600,
    recommendedPrice: 180,
    quickFillChips: [
      'Washing Machine Inverter Board',
      'AC Outdoor Inverter Driver PCB',
      'Submersible Drain Pump 220V',
      'Water Level Pressure Sensor',
      '12V 30A Power Relay Pack',
      'Automatic Door Lock Solenoid'
    ],
    subModels: [
      'Front-Load Washing Machine Main PCB',
      'Top-Load Washing Machine Control Board',
      'Split AC Indoor / Outdoor Inverter PCB',
      'Refrigerator Multi-Flow Inverter Control PCB',
      'Microwave Oven Microcontroller Board',
      'Induction Cooktop Mainboard (IGBT & Coil)'
    ],
    rawBoardPriceTiers: [
      { price: 150, label: 'Economy Appliance Board' },
      { price: 250, label: 'Standard Donor Board' },
      { price: 350, label: 'Multi-Part Intact Board' },
      { price: 450, label: 'Premium Inverter PCB (IGBTs Intact)' }
    ],
    defaultExtractionFeeInr: 40,
    subComponents: [
      {
        id: 'app-relay',
        partNumber: '12V / 24V 10A-30A Heavy Relay',
        partName: 'Heavy-Duty Power Relay Block',
        componentCategory: 'Relay',
        packageType: 'Through-Hole PCB Mount',
        priceTiers: [35, 55, 80],
        defaultTierIndex: 1,
        extractionFeeInr: 25,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 340
      },
      {
        id: 'app-igbt',
        partNumber: '1200V / 600V Inverter IGBT / IPM',
        partName: 'High-Power IGBT / IPM Motor Driver Module',
        componentCategory: 'Power Semiconductor',
        packageType: 'TO-247 / Multi-Pin SIP Module',
        priceTiers: [90, 140, 220],
        defaultTierIndex: 1,
        extractionFeeInr: 40,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 350
      },
      {
        id: 'app-solenoid',
        partNumber: '230V AC / 12V DC Inlet Valve',
        partName: 'Water Inlet Solenoid Valve Assembly',
        componentCategory: 'Actuator / Valve',
        packageType: 'Modular Fitting',
        priceTiers: [70, 110, 160],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'app-pump',
        partNumber: '230V Synchronous Drain Pump',
        partName: 'Drain Pump Synchronous Motor',
        componentCategory: 'Electric Motor',
        packageType: 'Flange Mount',
        priceTiers: [120, 180, 250],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'app-sensor',
        partNumber: 'Electronic Pressure Switch / Hall',
        partName: 'Water Level Pressure Sensor / Hall Sensor',
        componentCategory: 'Sensor Module',
        packageType: 'Harness Connector',
        priceTiers: [50, 80, 120],
        defaultTierIndex: 0,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'app-doorlock',
        partNumber: 'Thermal Delay Door Switch Assembly',
        partName: 'Washing Machine Door Interlock Switch',
        componentCategory: 'Safety Mechanism',
        packageType: 'Modular 3-Pin / 4-Pin',
        priceTiers: [60, 95, 140],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'app-display',
        partNumber: '7-Segment LED / Capacitive Touch Panel',
        partName: 'Front Appliance Display & Control Panel',
        componentCategory: 'Display / UI',
        packageType: 'PCB Assembly with Enclosure',
        priceTiers: [80, 130, 190],
        defaultTierIndex: 1,
        extractionFeeInr: 30,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'app-transformer',
        partNumber: 'Step-Down Transformer / EMI Choke',
        partName: 'Appliance Auxiliary Transformer & Filter',
        componentCategory: 'Inductive Component',
        packageType: 'Through-Hole PCB Mount',
        priceTiers: [45, 75, 110],
        defaultTierIndex: 1,
        extractionFeeInr: 25,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 340
      }
    ]
  },
  {
    id: 'BATTERIES_POWER_CELLS',
    name: 'Batteries, Li-Ion Cells & BMS',
    shortName: 'Batteries & BMS',
    description: '18650/21700 cells, smart laptop BMS, LiFePO4 packs, and charge controllers',
    icon: '🔋',
    minPrice: 35,
    maxPrice: 450,
    recommendedPrice: 120,
    quickFillChips: [
      '18650 2600mAh Tested Li-Ion Cell',
      '3S 40A Balance BMS Protection Board',
      '4S 12V LiFePO4 Battery BMS',
      'TP4056 1A USB-C Lithium Charger',
      'Drone LiPo 3S 2200mAh Pack',
      'Power Bank 10000mAh Dual-USB Board'
    ],
    subModels: [
      'Dead Laptop Battery Pack (3S / 4S / 6S)',
      'Powerbank Lithium Battery Assembly',
      'E-Bike / Electric Scooter Lithium Pack (10S / 13S)',
      'Drone / RC Li-Po Multi-Cell Battery Pack',
      'Power Tool Battery Pack (18V / 20V Max)',
      '12V Sealed Backup Power Unit'
    ],
    rawBoardPriceTiers: [
      { price: 80, label: 'Basic 3-Cell Battery Pack' },
      { price: 150, label: 'Standard 4-6 Cell Laptop Pack' },
      { price: 250, label: 'High-Capacity Multi-Cell Pack' },
      { price: 350, label: 'EV / E-Bike Modular Pack' }
    ],
    defaultExtractionFeeInr: 25,
    subComponents: [
      {
        id: 'bat-18650',
        partNumber: '18650 Tested Li-Ion Cylindrical Cell',
        partName: 'Grade-A Harvested 18650 Cell (>2000mAh)',
        componentCategory: 'Lithium Cell',
        packageType: '18650 (18mm x 65mm)',
        priceTiers: [35, 55, 85],
        defaultTierIndex: 1,
        extractionFeeInr: 25,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25,
        bypassHackTip: 'Cells tested for voltage retention (>3.7V) and spot-welded tabs ground clean.'
      },
      {
        id: 'bat-21700',
        partNumber: '21700 High-Drain Lithium Cell',
        partName: 'Tested High-Drain 21700 Cell (>4000mAh)',
        componentCategory: 'Lithium Cell',
        packageType: '21700 (21mm x 70mm)',
        priceTiers: [70, 110, 150],
        defaultTierIndex: 1,
        extractionFeeInr: 25,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'bat-bms',
        partNumber: 'Smart SMBus / 3S-4S BMS Controller',
        partName: 'Battery Management System (BMS) PCB',
        componentCategory: 'BMS Protection',
        packageType: 'PCB Module with MOSFETs',
        priceTiers: [40, 75, 120],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 330
      },
      {
        id: 'bat-lipo',
        partNumber: 'Intact Li-Po Flat Pouch Cell',
        partName: 'Lithium Polymer Pouch Cell (1000–5000mAh)',
        componentCategory: 'Li-Po Cell',
        packageType: 'Pouch Form Factor',
        priceTiers: [50, 90, 160],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'bat-charger-module',
        partNumber: 'TP4056 / QC Fast-Charge USB-C Board',
        partName: 'Type-C Lithium Charging Module',
        componentCategory: 'Power Converter',
        packageType: 'Mini SMD Module',
        priceTiers: [15, 25, 40],
        defaultTierIndex: 0,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 310
      },
      {
        id: 'bat-lifepo4',
        partNumber: '12V Sealed / LiFePO4 Backup Unit',
        partName: 'Auxiliary Power Storage Module',
        componentCategory: 'Storage Battery',
        packageType: 'Enclosed Pack',
        priceTiers: [150, 250, 400],
        defaultTierIndex: 1,
        extractionFeeInr: 30,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      }
    ]
  },
  {
    id: 'SMPS_POWER_INVERTERS',
    name: 'SMPS, Chargers & Inverters',
    shortName: 'SMPS & Power Units',
    description: 'MOSFETs, bridge rectifiers, 450V caps, and high-frequency transformers',
    icon: '⚡',
    minPrice: 30,
    maxPrice: 350,
    recommendedPrice: 95,
    quickFillChips: [
      '12V 5A Industrial Metal SMPS',
      '24V 10A CNC High-Power Supply',
      'Pure Sine Wave 500W Inverter Board',
      'High-Voltage N-MOSFET (IRFZ44N / IRF3205)',
      '65W GaN Laptop Charger PCB',
      '450V 100uF Low-ESR Filter Capacitor'
    ],
    subModels: [
      'Laptop 65W / 90W Charger PCB',
      'Desktop ATX SMPS Power Supply Board',
      'Industrial 12V / 24V Metal-Mesh SMPS',
      'Home Pure Sine-Wave UPS Inverter PCB',
      'Solar Charge Controller / Micro-Inverter Board',
      'LED Streetlight / High-Bay Driver Module'
    ],
    rawBoardPriceTiers: [
      { price: 45, label: 'Economy Adapter PCB' },
      { price: 85, label: 'Standard ATX SMPS Board' },
      { price: 140, label: 'Industrial High-Power SMPS' },
      { price: 220, label: 'Heavy Sine-Wave Inverter Board' }
    ],
    defaultExtractionFeeInr: 25,
    subComponents: [
      {
        id: 'smps-mosfet',
        partNumber: '10N60 / IRFZ44N / IRF3205 / P55NF06',
        partName: 'High-Voltage N-Channel Power MOSFET',
        componentCategory: 'Power Transistor',
        packageType: 'TO-220 / TO-247',
        priceTiers: [20, 35, 55],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 340
      },
      {
        id: 'smps-bridge',
        partNumber: 'GBU406 / KBPC3510 / DB107',
        partName: 'Single-Phase Full-Bridge Rectifier',
        componentCategory: 'Rectifier',
        packageType: 'SIP-4 / Square Metal Pack',
        priceTiers: [15, 25, 45],
        defaultTierIndex: 0,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 340
      },
      {
        id: 'smps-bulk-cap',
        partNumber: '68uF–470uF 400V / 450V High-Voltage Cap',
        partName: 'Primary High-Voltage Filter Capacitor',
        componentCategory: 'Electrolytic Capacitor',
        packageType: 'Radial Can (22mm-35mm)',
        priceTiers: [25, 45, 75],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 340
      },
      {
        id: 'smps-output-caps',
        partNumber: '1000uF–3300uF 16V / 25V / 35V Low-ESR',
        partName: 'Low-ESR Secondary Filter Capacitor Pack (2x)',
        componentCategory: 'Electrolytic Capacitor',
        packageType: 'Radial Can Set',
        priceTiers: [12, 20, 35],
        defaultTierIndex: 0,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 330
      },
      {
        id: 'smps-transformer',
        partNumber: 'High-Frequency Ferrite Transformer / Choke',
        partName: 'Toroidal Output Inductor / Ferrite Chopper',
        componentCategory: 'Magnetics',
        packageType: 'Ferrite Core Assembly',
        priceTiers: [25, 45, 80],
        defaultTierIndex: 1,
        extractionFeeInr: 25,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 350
      },
      {
        id: 'smps-pwm',
        partNumber: 'PC817 Opto + TL494 / UC3842 / SG3525',
        partName: 'PWM Controller IC & Optocoupler Set',
        componentCategory: 'Control IC',
        packageType: 'DIP-16 / DIP-4',
        priceTiers: [12, 20, 35],
        defaultTierIndex: 0,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 320
      },
      {
        id: 'smps-cooling',
        partNumber: 'Extruded Heatsink + 12V 80mm-120mm Fan',
        partName: 'Thermal Heatsink & DC Brushless Fan',
        componentCategory: 'Cooling Assembly',
        packageType: 'Aluminum + Frame Fan',
        priceTiers: [25, 45, 70],
        defaultTierIndex: 1,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      }
    ]
  },
  {
    id: 'LAPTOP_MOBILE_MOTHERBOARDS',
    name: 'Laptop & Mobile Motherboards/Spares',
    shortName: 'Motherboards & Spares',
    description: 'Power ICs, charging controllers, Super I/O, BIOS chips, and heatpipes',
    icon: '💻',
    minPrice: 50,
    maxPrice: 800,
    recommendedPrice: 220,
    quickFillChips: [
      'Dell Latitude i5 Laptop Motherboard',
      'HP Pavilion Logic Board (RAM & VRM OK)',
      'Realme / Redmi OLED Display Flex Cable',
      'Lenovo ThinkPad Backlit Keyboard & TrackPoint',
      'Wi-Fi 6 + Bluetooth 5.2 M.2 Card',
      'Laptop CPU Copper Heatpipe + Fan'
    ],
    subModels: [
      'Dead Laptop Motherboard (Dell / HP / Lenovo / Asus)',
      'Desktop ATX / Micro-ATX Motherboard',
      'Smartphone Logic Board (Android / iPhone donor)',
      'Tablet / iPad Logic Board',
      'All-in-One PC Mainboard'
    ],
    rawBoardPriceTiers: [
      { price: 200, label: 'Partial Donor Motherboard' },
      { price: 350, label: 'Standard Laptop Mainboard' },
      { price: 500, label: 'High-End Gaming / Discrete GPU Board' },
      { price: 650, label: 'Complete Board with Heatsink & Ports' }
    ],
    defaultExtractionFeeInr: 35,
    subComponents: [
      {
        id: 'mb-buck-ic',
        partNumber: 'TPS51225 / RT8223 / SY8286',
        partName: '3.3V / 5V System Buck Power Management IC',
        componentCategory: 'Power Management IC',
        packageType: 'QFN-20 / QFN-32 SMD',
        priceTiers: [45, 75, 110],
        defaultTierIndex: 1,
        extractionFeeInr: 35,
        difficulty: 'LEVEL_3_HOT_AIR_SMD',
        recommendedTempC: 335
      },
      {
        id: 'mb-charge-ic',
        partNumber: 'BQ24780S / ISL88739 / SMB1351',
        partName: 'Battery Charging & Power Path Controller IC',
        componentCategory: 'Power Management IC',
        packageType: 'QFN-28 / QFN-32 SMD',
        priceTiers: [55, 90, 140],
        defaultTierIndex: 1,
        extractionFeeInr: 35,
        difficulty: 'LEVEL_3_HOT_AIR_SMD',
        recommendedTempC: 335
      },
      {
        id: 'mb-sio',
        partNumber: 'IT8586E / KB9012 / MEC1416',
        partName: 'Super I/O Embedded Controller (EC)',
        componentCategory: 'Embedded Controller',
        packageType: 'TQFP-128 SMD',
        priceTiers: [80, 130, 190],
        defaultTierIndex: 1,
        extractionFeeInr: 45,
        difficulty: 'LEVEL_3_HOT_AIR_SMD',
        recommendedTempC: 340
      },
      {
        id: 'mb-bios',
        partNumber: 'W25Q64JV / W25Q128JVSQ (8MB/16MB)',
        partName: 'BIOS / UEFI SPI Flash Chip',
        componentCategory: 'Memory IC',
        packageType: 'SOIC-8 / WSON-8 SMD',
        priceTiers: [35, 55, 85],
        defaultTierIndex: 1,
        extractionFeeInr: 25,
        difficulty: 'LEVEL_3_HOT_AIR_SMD',
        recommendedTempC: 325
      },
      {
        id: 'mb-ports',
        partNumber: 'Type-C 24-Pin / HDMI / DC Jack Connector',
        partName: 'Precision I/O Charging & Video Port Assembly',
        componentCategory: 'Electromechanical',
        packageType: 'Hybrid SMD/Through-Hole',
        priceTiers: [25, 45, 70],
        defaultTierIndex: 1,
        extractionFeeInr: 25,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 340
      },
      {
        id: 'mb-heatpipe',
        partNumber: 'Copper Heatpipe + Radial CPU Fan Assembly',
        partName: 'Laptop Copper Heatpipe & Centrifugal Fan',
        componentCategory: 'Thermal Assembly',
        packageType: 'Modular Bolt-On',
        priceTiers: [90, 150, 240],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      }
    ]
  },
  {
    id: 'DISPLAYS_SENSORS_MODULES',
    name: 'Displays, Sensors & Audio/TV Boards',
    shortName: 'Displays & Sensors',
    description: 'LCDs, OLEDs, TFT touchscreens, ultrasonic/gas sensors, and Bluetooth modules',
    icon: '📟',
    minPrice: 20,
    maxPrice: 500,
    recommendedPrice: 110,
    quickFillChips: [
      '0.96" I2C 128x64 Blue OLED Display',
      '16x2 Character LCD + I2C Backpack',
      'HC-SR04 Ultrasonic Distance Sensor',
      'DHT22 High-Precision Temp & Humidity Sensor',
      '5MP Night Vision Camera Module',
      'MPU-6050 6-Axis Gyroscope Module'
    ],
    subModels: [
      'Maker Display & Sensor Kit Board',
      'Electronic Weighing Scale / Load Cell Motherboard',
      'CCTV / IP Security Camera Mainboard',
      'Smart Home ZigBee / ESP32 Sensor Hub PCB',
      'Portable Bluetooth Speaker / Audio Board'
    ],
    rawBoardPriceTiers: [
      { price: 40, label: 'Basic Sensor PCB' },
      { price: 80, label: 'Display & Sensor Assembly' },
      { price: 150, label: 'Smart IoT Hub Assembly' }
    ],
    defaultExtractionFeeInr: 15,
    subComponents: [
      {
        id: 'disp-lcd',
        partNumber: '16x2 / 20x4 Alphanumeric LCD + I2C Backpack',
        partName: 'Character LCD Display Module',
        componentCategory: 'Display',
        packageType: '16-Pin / 4-Pin I2C Header',
        priceTiers: [35, 55, 80],
        defaultTierIndex: 1,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'disp-oled',
        partNumber: 'SSD1306 / SH1106 0.96" / 1.3" OLED',
        partName: 'Monochrome I2C / SPI Graphic OLED Module',
        componentCategory: 'Display',
        packageType: '4-Pin / 7-Pin Header Module',
        priceTiers: [40, 65, 95],
        defaultTierIndex: 1,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'disp-tft',
        partNumber: '2.4" / 3.5" TFT Touch Screen (ILI9341 / Nextion)',
        partName: 'Full-Color TFT LCD with Resistive/Capacitive Touch',
        componentCategory: 'Display',
        packageType: 'FPC / Header Module',
        priceTiers: [120, 220, 350],
        defaultTierIndex: 1,
        extractionFeeInr: 25,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'sensor-env',
        partNumber: 'HC-SR04 / MQ-2/135 / HX711 / PIR / IR',
        partName: 'Ultrasonic / Gas / Strain / PIR Motion Sensor',
        componentCategory: 'Sensor',
        packageType: 'Modular PCB Component',
        priceTiers: [15, 30, 50],
        defaultTierIndex: 1,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'sensor-comms',
        partNumber: 'HC-05 / NRF24L01 / NEO-6M GPS / SIM800L',
        partName: 'Bluetooth / RF / GPS / GSM Cellular Module',
        componentCategory: 'Wireless Module',
        packageType: 'Castellated / Pin Header Module',
        priceTiers: [45, 85, 150],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 320
      }
    ]
  },
  {
    id: 'MOTORS_ROBOTICS_CNC',
    name: 'Motors, Drivers & Robotics',
    shortName: 'Motors & Robotics',
    description: 'NEMA stepper motors, TMC drivers, L298N boards, and heated bed cartridges',
    icon: '🦾',
    minPrice: 30,
    maxPrice: 400,
    recommendedPrice: 140,
    quickFillChips: [
      'NEMA 17 Bipolar Stepper Motor',
      'TMC2209 Ultra-Silent Stepper Driver',
      'L298N Dual H-Bridge Motor Driver',
      'MG996R Metal Gear 15kg Servo Motor',
      '12V 1000RPM High-Torque DC Motor',
      '775 Dual Ball-Bearing DC Spindle Motor'
    ],
    subModels: [
      '3D Printer Controller Board (Ender-3 / RAMPS / SKR)',
      'CNC Router / Laser Engraver Controller PCB',
      'Dual DC Motor Driver PCB (L298N / BTS7960)',
      'Drone / Gimbal Brushless Flight Controller',
      'Industrial Robotic Arm Servo Controller'
    ],
    rawBoardPriceTiers: [
      { price: 80, label: 'Motor Driver Donor Board' },
      { price: 180, label: 'Standard 3D Printer Mainboard' },
      { price: 320, label: 'Complete CNC / Multi-Axis Controller' }
    ],
    defaultExtractionFeeInr: 20,
    subComponents: [
      {
        id: 'mot-stepper',
        partNumber: 'NEMA 17 / NEMA 23 Bipolar Stepper Motor',
        partName: 'Bipolar High-Torque Stepper Motor',
        componentCategory: 'Actuator',
        packageType: '42mm / 57mm Flange',
        priceTiers: [110, 170, 260],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'mot-silent-step',
        partNumber: 'TMC2208 / TMC2209 / A4988 / DRV8825',
        partName: 'SilentStepStick Stepper Motor Driver Module',
        componentCategory: 'Motor Driver',
        packageType: 'StepStick Standard Module',
        priceTiers: [35, 60, 95],
        defaultTierIndex: 1,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'mot-hbridge',
        partNumber: 'L298N Dual H-Bridge / BTS7960 43A',
        partName: 'Dual DC / Stepper Motor Driver Board',
        componentCategory: 'Driver Board',
        packageType: 'Screw-Terminal PCB Module',
        priceTiers: [25, 55, 110],
        defaultTierIndex: 1,
        extractionFeeInr: 20,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'mot-servo',
        partNumber: 'Metal-Gear MG996R / Johnson 12V Geared',
        partName: 'High-Torque Metal Servo / Geared DC Motor',
        componentCategory: 'Motor / Servo',
        packageType: 'Shaft Output Unit',
        priceTiers: [40, 75, 130],
        defaultTierIndex: 1,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      },
      {
        id: 'mot-hotend-parts',
        partNumber: '24V/12V 40W Heater + NTC 100K Thermistor',
        partName: 'Extruder Heater Cartridge & Thermistor Set',
        componentCategory: 'Thermal Assembly',
        packageType: 'Cartridge Probe',
        priceTiers: [25, 45, 75],
        defaultTierIndex: 1,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      }
    ]
  },
  {
    id: 'AUDIO_TV_CONSUMER',
    name: 'Audio, TV & Telecom Boards',
    shortName: 'Audio, TV & Telecom',
    description: 'Class-D amp ICs, LED backlight drivers, T-Con boards, and high-gain Wi-Fi antennas',
    icon: '📡',
    minPrice: 20,
    maxPrice: 500,
    recommendedPrice: 110,
    quickFillChips: [
      'TPA3116D2 2x50W Stereo Bluetooth Amplifier',
      '32" Smart LED TV Power Supply Board',
      'PAM8403 2x3W Micro Audio Amplifier',
      'Bluetooth 5.0 Audio Receiver Board with DAC',
      'Subwoofer Low-Pass Filter Preamp Board',
      'Universal LED Backlight Inverter Driver'
    ],
    subModels: [
      'Smart LED TV Main Logic / T-Con Board (32"-55")',
      'High-Power Hi-Fi Audio Amplifier PCB',
      'Dual-Band Wi-Fi 6 Gigabit Router PCB',
      'Set-Top Box (DTH / Android TV) Mainboard',
      'Soundbar Subwoofer Power Amplifier Board'
    ],
    rawBoardPriceTiers: [
      { price: 60, label: 'Audio / Router Donor Board' },
      { price: 120, label: 'LED TV Backlight / T-Con Board' },
      { price: 220, label: 'Smart TV Motherboard' }
    ],
    defaultExtractionFeeInr: 25,
    subComponents: [
      {
        id: 'aud-amp-ic',
        partNumber: 'TDA2030 / TPA3116D2 / TDA7297 / LM386',
        partName: 'Class-D / Class-AB Stereo Audio Power Amplifier IC',
        componentCategory: 'Audio IC',
        packageType: 'TO-220-5 / TSSOP-32 PowerPAD',
        priceTiers: [25, 50, 85],
        defaultTierIndex: 1,
        extractionFeeInr: 25,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 340
      },
      {
        id: 'tv-backlight-driver',
        partNumber: 'Constant-Current LED TV Backlight Inverter',
        partName: 'High-Voltage LED Backlight Boost Board Module',
        componentCategory: 'Power Converter',
        packageType: 'Modular Power Board',
        priceTiers: [70, 130, 220],
        defaultTierIndex: 1,
        extractionFeeInr: 25,
        difficulty: 'LEVEL_2_BASIC_IRON',
        recommendedTempC: 330
      },
      {
        id: 'router-antennas',
        partNumber: '5dBi Dual-Band Dipole Antennas + IPEX Cables (2x)',
        partName: 'High-Gain 2.4/5GHz Wi-Fi Antenna & Port Set',
        componentCategory: 'RF Antenna',
        packageType: 'SMA / IPEX Pigtail',
        priceTiers: [20, 40, 65],
        defaultTierIndex: 1,
        extractionFeeInr: 15,
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25
      }
    ]
  }
];

// Comprehensive Indian States and Districts for Consumer Location Selector
export interface StateDistricts {
  state: string;
  districts: string[];
}

export const INDIAN_STATES_DISTRICTS: StateDistricts[] = [
  {
    state: 'Tamil Nadu',
    districts: [
      'Chennai',
      'Chengalpattu',
      'Kanchipuram',
      'Tiruvallur',
      'Coimbatore',
      'Madurai',
      'Tiruchirappalli',
      'Salem',
      'Vellore',
      'Tiruppur',
      'Erode',
      'Thoothukudi',
      'Tirunelveli',
      'Kanyakumari',
      'Thanjavur',
      'Dindigul',
      'Ranipet',
      'Tirupathur',
      'Krishnagiri',
      'Dharmapuri',
      'Namakkal',
      'Karur',
      'Cuddalore',
      'Villupuram',
      'Kallakurichi',
      'Nagapattinam',
      'Mayiladuthurai',
      'Tiruvarur',
      'Pudukkottai',
      'Sivaganga',
      'Ramanathapuram',
      'Virudhunagar',
      'Tenkasi',
      'Theni',
      'Perambalur',
      'Ariyalur',
      'Nilgiris',
      'Tiruvannamalai'
    ]
  },
  {
    state: 'Karnataka',
    districts: [
      'Bengaluru Urban',
      'Bengaluru Rural',
      'Mysuru',
      'Mangaluru (Dakshina Kannada)',
      'Hubballi-Dharwad',
      'Belagavi',
      'Tumakuru',
      'Shivamogga',
      'Kalaburagi',
      'Udupi',
      'Ballari',
      'Davanagere',
      'Hassan',
      'Mandya'
    ]
  },
  {
    state: 'Telangana',
    districts: [
      'Hyderabad',
      'Medchal-Malkajgiri',
      'Rangareddy',
      'Warangal',
      'Karimnagar',
      'Nizamabad',
      'Khammam'
    ]
  },
  {
    state: 'Maharashtra',
    districts: [
      'Mumbai City',
      'Mumbai Suburban',
      'Pune',
      'Thane',
      'Nagpur',
      'Nashik',
      'Aurangabad (Chhatrapati Sambhajinagar)',
      'Solapur',
      'Kolhapur'
    ]
  },
  {
    state: 'Kerala',
    districts: [
      'Ernakulam (Kochi)',
      'Thiruvananthapuram',
      'Kozhikode',
      'Thrissur',
      'Kollam',
      'Palakkad',
      'Malappuram',
      'Kannur',
      'Kottayam',
      'Alappuzha'
    ]
  },
  {
    state: 'Delhi NCR',
    districts: [
      'New Delhi',
      'Central Delhi',
      'South Delhi',
      'North Delhi',
      'Gurugram',
      'Noida (Gautam Buddha Nagar)',
      'Ghaziabad',
      'Faridabad'
    ]
  },
  {
    state: 'Andhra Pradesh',
    districts: [
      'Visakhapatnam',
      'Vijayawada (NTR)',
      'Guntur',
      'Tirupati',
      'Kurnool',
      'Nellore',
      'Kakinada'
    ]
  }
];

