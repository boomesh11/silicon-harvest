import {
  DonorBoard,
  HarvestableComponent,
  Order,
  BoardTemplate,
  BargainOffer,
  UserProfile,
} from '../types/harvest';

// Clean production initialization: zero fake/seed inventory, orders, bargains, or users.
export const INITIAL_DONOR_BOARDS: DonorBoard[] = [];
export const INITIAL_COMPONENTS: HarvestableComponent[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_BARGAIN_OFFERS: BargainOffer[] = [];
export const INITIAL_BARGAINS: BargainOffer[] = INITIAL_BARGAIN_OFFERS;
export const INITIAL_REGISTERED_USERS: UserProfile[] = [];

export const SEED_DONOR_BOARDS: DonorBoard[] = INITIAL_DONOR_BOARDS;
export const SEED_COMPONENTS: HarvestableComponent[] = INITIAL_COMPONENTS;
export const SEED_ORDERS: Order[] = INITIAL_ORDERS;

// Hardware Reference Templates for 1-Click Auto-BoM Seller Listing
export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'TPL-UNO',
    templateName: 'Arduino Uno R3 (ATmega328P)',
    boardName: 'Dead Arduino Uno R3 Development Board',
    category: 'IC_MICROCONTROLLERS',
    defaultRawPriceInr: 60,
    defaultPrimaryFaultPartNumber: 'AMS1117-5.0',
    components: [
      {
        partNumber: 'ATMEGA328P-PU',
        partName: '8-Bit AVR Microcontroller (28-Pin DIP)',
        componentCategory: 'Microcontroller',
        packageType: 'DIP-28 Socket',
        difficulty: 'LEVEL_1_PLUG_PULL',
        recommendedTempC: 25,
        partPriceInr: 110,
        extractionFeeInr: 10,
        bypassHackTip: 'Pry out of DIP-28 socket with IC puller — zero soldering required.',
      },
      {
        partNumber: 'CH340G',
        partName: 'USB to TTL Serial UART Converter IC',
        componentCategory: 'USB-TTL IC',
        packageType: 'SOIC-16 SMD',
        difficulty: 'LEVEL_3_HOT_AIR_SMD',
        recommendedTempC: 325,
        partPriceInr: 20,
        extractionFeeInr: 20,
      },
      {
        partNumber: 'AMS1117-5.0',
        partName: '5.0V 1A LDO Voltage Regulator',
        componentCategory: 'Voltage Regulator',
        packageType: 'SOT-223 SMD',
        difficulty: 'LEVEL_3_HOT_AIR_SMD',
        recommendedTempC: 315,
        partPriceInr: 12,
        extractionFeeInr: 15,
      },
    ],
  },
  {
    id: 'TPL-WASHING',
    templateName: 'Washing Machine Inverter Driver PCB',
    boardName: 'Samsung / LG Washing Machine Control Board',
    category: 'WASHING_MACHINE_APPLIANCE',
    defaultRawPriceInr: 180,
    defaultPrimaryFaultPartNumber: 'TRIAC-BT136',
    components: [
      {
        partNumber: 'STK621-068',
        partName: '3-Phase Inverter Intelligent Power Module',
        componentCategory: 'Motor Driver IPM',
        packageType: 'SIP-23',
        difficulty: 'LEVEL_2_THROUGH_HOLE',
        recommendedTempC: 350,
        partPriceInr: 140,
        extractionFeeInr: 30,
      },
      {
        partNumber: 'G5Q-14-12VDC',
        partName: '12V 10A PCB Power Relay',
        componentCategory: 'Relay',
        packageType: 'SPDT',
        difficulty: 'LEVEL_2_THROUGH_HOLE',
        recommendedTempC: 340,
        partPriceInr: 35,
        extractionFeeInr: 15,
      },
    ],
  },
];
