export interface PinDefinition {
  pinNumber: number | string;
  pinName: string;
  functionDesc: string;
  probeHighlight?: 'RED_PROBE' | 'BLACK_PROBE' | 'OUTPUT_CHECK';
}

export interface IcDatasheetSpec {
  partNumberPrefix: string;
  manufacturer: string;
  newRetailPriceInr: number;
  operatingVoltage: string;
  maxCurrent: string;
  airflowPercent: number;
  dwellTimeSeconds: number;
  fluxType: string;
  kaptonShieldNote: string;
  multimeterMode: 'DIODE_DROP' | 'DC_VOLTAGE' | 'RESISTANCE_OHM';
  redProbePin: string;
  blackProbePin: string;
  healthyReadingRange: string;
  faultyReadingIndicator: string;
  dropInEquivalents: string[];
  pins: PinDefinition[];
}

export const IC_DATASHEETS: Record<string, IcDatasheetSpec> = {
  CH340G: {
    partNumberPrefix: 'CH340G',
    manufacturer: 'WCH (Nanjing Qinheng Microelectronics)',
    newRetailPriceInr: 65,
    operatingVoltage: '3.3V – 5.0V DC',
    maxCurrent: '30mA active',
    airflowPercent: 45,
    dwellTimeSeconds: 22,
    fluxType: 'No-Clean Tack Flux (ROL0)',
    kaptonShieldNote:
      'Shield adjacent Micro-USB plastic tongue and 12MHz crystal with 1 layer of Kapton tape.',
    multimeterMode: 'DIODE_DROP',
    redProbePin: 'Pin 1 (GND)',
    blackProbePin: 'Pin 16 (VCC) & Pin 5 (UD+) / Pin 6 (UD-)',
    healthyReadingRange: '0.48V – 0.56V forward drop on UD+/UD- ESD diodes',
    faultyReadingIndicator: '< 0.02V short between Pin 16 (VCC) and Pin 1 (GND)',
    dropInEquivalents: ['CH340C (Internal Crystal)', 'CH340T', 'CP2102 (With Adapter)'],
    pins: [
      { pinNumber: 1, pinName: 'GND', functionDesc: 'Ground Reference', probeHighlight: 'RED_PROBE' },
      { pinNumber: 2, pinName: 'TXD', functionDesc: 'Serial Async Transmit Output', probeHighlight: 'OUTPUT_CHECK' },
      { pinNumber: 3, pinName: 'RXD', functionDesc: 'Serial Async Receive Input' },
      { pinNumber: 4, pinName: 'V3', functionDesc: '3.3V Internal LDO Decoupling Pin' },
      { pinNumber: 5, pinName: 'UD+', functionDesc: 'USB D+ Differential Line', probeHighlight: 'BLACK_PROBE' },
      { pinNumber: 6, pinName: 'UD-', functionDesc: 'USB D- Differential Line', probeHighlight: 'BLACK_PROBE' },
      { pinNumber: 7, pinName: 'XI', functionDesc: '12MHz Crystal Input' },
      { pinNumber: 8, pinName: 'XO', functionDesc: '12MHz Crystal Output' },
      { pinNumber: 16, pinName: 'VCC', functionDesc: 'Positive Supply Input (3.3V/5V)', probeHighlight: 'BLACK_PROBE' },
    ],
  },
  'AMS1117-3.3': {
    partNumberPrefix: 'AMS1117-3.3',
    manufacturer: 'Advanced Monolithic Systems',
    newRetailPriceInr: 28,
    operatingVoltage: '4.75V – 12V VIN → 3.30V VOUT',
    maxCurrent: '1.0A Continuous',
    airflowPercent: 55,
    dwellTimeSeconds: 18,
    fluxType: 'RMA Rosin Mildly Activated Flux',
    kaptonShieldNote:
      'Pre-tin the large SOT-223 collector tab with leaded solder to lower melt threshold by 20°C.',
    multimeterMode: 'DC_VOLTAGE',
    redProbePin: 'Pin 2 / Big Tab (VOUT)',
    blackProbePin: 'Pin 1 (GND)',
    healthyReadingRange: '3.27V – 3.33V DC under 5V VIN bench supply (No VIN-VOUT short)',
    faultyReadingIndicator: 'VIN passed straight to VOUT (0.0Ω Pin 3 to Pin 2)',
    dropInEquivalents: ['LM1117MPX-3.3', 'LD1117S33TR', 'NCP1117ST33T3G'],
    pins: [
      { pinNumber: 1, pinName: 'GND', functionDesc: 'Ground Reference', probeHighlight: 'BLACK_PROBE' },
      { pinNumber: 2, pinName: 'VOUT', functionDesc: 'Regulated 3.3V Output', probeHighlight: 'RED_PROBE' },
      { pinNumber: 3, pinName: 'VIN', functionDesc: 'Unregulated DC Input (5V–12V)' },
      { pinNumber: 'TAB', pinName: 'VOUT_TAB', functionDesc: 'Thermal Heatsink Tab (Tied to Pin 2)', probeHighlight: 'OUTPUT_CHECK' },
    ],
  },
  'ATMEGA328P-PU': {
    partNumberPrefix: 'ATMEGA328P-PU',
    manufacturer: 'Microchip / Atmel',
    newRetailPriceInr: 210,
    operatingVoltage: '1.8V – 5.5V DC',
    maxCurrent: '200mA Package Max (40mA/Pin)',
    airflowPercent: 0,
    dwellTimeSeconds: 5,
    fluxType: 'None (Mechanical IC Extractor / Cold Pull)',
    kaptonShieldNote:
      'Rock gently from both ends of the DIP-28 socket simultaneously to prevent bending Pin 1 or Pin 28.',
    multimeterMode: 'RESISTANCE_OHM',
    redProbePin: 'Pin 7 (VCC) & Pin 20 (AVCC)',
    blackProbePin: 'Pin 8 & Pin 22 (GND)',
    healthyReadingRange: '3.2kΩ – 12kΩ High-Impedance Rail + 16MHz Optiboot LED Blink Pass',
    faultyReadingIndicator: '< 15Ω VCC-to-GND internal rail short',
    dropInEquivalents: ['ATMEGA328P-PN', 'ATMEGA328-PU (Check Signature Byte 0x1E9514)'],
    pins: [
      { pinNumber: 1, pinName: 'PC6/RESET', functionDesc: 'Active-Low Reset Input (10kΩ Pull-up)' },
      { pinNumber: 7, pinName: 'VCC', functionDesc: 'Digital Supply Voltage (+5V)', probeHighlight: 'RED_PROBE' },
      { pinNumber: 8, pinName: 'GND', functionDesc: 'Digital Ground', probeHighlight: 'BLACK_PROBE' },
      { pinNumber: 9, pinName: 'PB6/XTAL1', functionDesc: '16MHz Crystal Input' },
      { pinNumber: 10, pinName: 'PB7/XTAL2', functionDesc: '16MHz Crystal Output' },
      { pinNumber: 19, pinName: 'PB5/SCK', functionDesc: 'Arduino D13 / Built-in LED Test Pin', probeHighlight: 'OUTPUT_CHECK' },
      { pinNumber: 20, pinName: 'AVCC', functionDesc: 'Analog ADC Supply (+5V)', probeHighlight: 'RED_PROBE' },
      { pinNumber: 22, pinName: 'AGND', functionDesc: 'Analog Ground', probeHighlight: 'BLACK_PROBE' },
    ],
  },
  'ATMEGA16U2-MU': {
    partNumberPrefix: 'ATMEGA16U2-MU',
    manufacturer: 'Microchip / Atmel',
    newRetailPriceInr: 140,
    operatingVoltage: '2.7V – 5.5V DC (USB Bus Powered)',
    maxCurrent: '50mA Active',
    airflowPercent: 35,
    dwellTimeSeconds: 28,
    fluxType: 'Amtech NC-559-V2 Tack Flux',
    kaptonShieldNote:
      'QFN-32 center ground pad requires 120°C bottom preheating to avoid popcorning.',
    multimeterMode: 'DIODE_DROP',
    redProbePin: 'Center EPAD (GND)',
    blackProbePin: 'Pin 29 (D-) & Pin 30 (D+) / Pin 4 (VCC)',
    healthyReadingRange: '0.51V – 0.55V matched pair on USB D+/D- differential lines',
    faultyReadingIndicator: 'Asymmetric diode drop (> 0.15V mismatch between D+ and D-)',
    dropInEquivalents: ['ATMEGA8U2-MU', 'AT90USB162'],
    pins: [
      { pinNumber: 4, pinName: 'VCC', functionDesc: '5V USB VBUS Supply', probeHighlight: 'BLACK_PROBE' },
      { pinNumber: 24, pinName: 'PC1/RESET', functionDesc: 'ISP Reset (Jump to GND for Bypass Mode)' },
      { pinNumber: 29, pinName: 'D-', functionDesc: 'USB Data Minus', probeHighlight: 'BLACK_PROBE' },
      { pinNumber: 30, pinName: 'D+', functionDesc: 'USB Data Plus', probeHighlight: 'BLACK_PROBE' },
      { pinNumber: 31, pinName: 'UGND', functionDesc: 'USB Ground Shield', probeHighlight: 'RED_PROBE' },
      { pinNumber: 'EPAD', pinName: 'PAD_GND', functionDesc: 'Bottom Thermal/Ground Pad', probeHighlight: 'RED_PROBE' },
    ],
  },
  MDF10N60B: {
    partNumberPrefix: 'MDF10N60B',
    manufacturer: 'MagnaChip Semiconductor',
    newRetailPriceInr: 85,
    operatingVoltage: '600V VDS Max / ±30V VGS',
    maxCurrent: '10A Continuous Drain',
    airflowPercent: 60,
    dwellTimeSeconds: 15,
    fluxType: 'Rosin Core + Desoldering Braid / Vacuum Pump',
    kaptonShieldNote:
      'Discharge the primary 400V bulk capacitor through a 1kΩ 5W power resistor before touching the PCB!',
    multimeterMode: 'DIODE_DROP',
    redProbePin: 'Pin 3 (Source)',
    blackProbePin: 'Pin 2 (Drain)',
    healthyReadingRange: '0.44V – 0.52V Intrinsic Body Diode Drop (OL in reverse, ∞ Gate-to-Source)',
    faultyReadingIndicator: '0.00V dead short across Gate-Drain-Source',
    dropInEquivalents: ['10N60C', 'FQP10N60C', 'STP10NK60ZFP'],
    pins: [
      { pinNumber: 1, pinName: 'GATE', functionDesc: 'Insulated Gate Input (Must read ∞Ω to Source)' },
      { pinNumber: 2, pinName: 'DRAIN', functionDesc: 'High-Voltage Switching Drain (600V)', probeHighlight: 'BLACK_PROBE' },
      { pinNumber: 3, pinName: 'SOURCE', functionDesc: 'Current Sense Source Return', probeHighlight: 'RED_PROBE' },
    ],
  },
};

export function getDatasheetForComponent(
  partNumber: string,
  category: string,
  packageType: string,
  recommendedTempC: number,
  partPriceInr: number
): IcDatasheetSpec {
  const exact = IC_DATASHEETS[partNumber];
  if (exact) return exact;

  return {
    partNumberPrefix: partNumber,
    manufacturer: 'OEM Industrial Semiconductor',
    newRetailPriceInr: Math.max(partPriceInr * 3, 45),
    operatingVoltage: '3.3V – 24V Nominal Rail',
    maxCurrent: '1.5A Rated',
    airflowPercent: 45,
    dwellTimeSeconds: 20,
    fluxType: 'No-Clean SMD Tack Flux (ROL0)',
    kaptonShieldNote: `Mask surrounding plastic connectors within 12mm of ${packageType} footprint before applying ${recommendedTempC}°C hot air.`,
    multimeterMode: 'DIODE_DROP',
    redProbePin: 'GND / Return Pad',
    blackProbePin: 'VCC / Primary Signal IO Pins',
    healthyReadingRange: '0.46V – 0.58V ESD Protection Diode Drop / Zero Short',
    faultyReadingIndicator: '< 2.0Ω Dead Short to Ground Plane',
    dropInEquivalents: [`${partNumber}-TR`, `Generic ${category} (${packageType})`],
    pins: [
      { pinNumber: 1, pinName: 'VCC / IN', functionDesc: 'Primary Power / Input Pin', probeHighlight: 'BLACK_PROBE' },
      { pinNumber: 2, pinName: 'IO / OUT', functionDesc: 'Primary Regulated / Signal Output', probeHighlight: 'OUTPUT_CHECK' },
      { pinNumber: 3, pinName: 'ENABLE / CTRL', functionDesc: 'Logic Control / Gate Pin' },
      { pinNumber: 4, pinName: 'GND', functionDesc: 'Common Ground Reference', probeHighlight: 'RED_PROBE' },
    ],
  };
}

