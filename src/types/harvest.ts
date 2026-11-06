export type BoardCategory =
  | 'ACADEMIC_MAKER'
  | 'POWER_SMPS'
  | 'APPLIANCE_PCB'
  | 'LAPTOP_MOBILE'
  | 'IC_MICROCONTROLLERS'
  | 'WASHING_MACHINE_APPLIANCE'
  | 'BATTERIES_POWER_CELLS'
  | 'SMPS_POWER_INVERTERS'
  | 'LAPTOP_MOBILE_MOTHERBOARDS'
  | 'DISPLAYS_SENSORS_MODULES'
  | 'MOTORS_ROBOTICS_CNC'
  | 'AUDIO_TV_CONSUMER';

export type BoardStatus =
  | 'AVAILABLE'
  | 'PARTIALLY_HARVESTED'
  | 'SOLD_RAW';

export type ExtractionDifficulty =
  | 'LEVEL_1_PLUG_PULL'
  | 'LEVEL_2_BASIC_IRON'
  | 'LEVEL_3_HOT_AIR_SMD';

export type ComponentStatus =
  | 'INTACT'
  | 'EXTRACTED_SOLD'
  | 'FAULTY_ON_ARRIVAL';

export type OrderMode =
  | 'RAW_DONOR_BOARD'
  | 'EXTRACTED_TESTED_PART';

export type DeliveryType =
  | 'CAMPUS_HUB_PICKUP'
  | 'HYPERLOCAL_PORTER'
  | 'OUTSTATION_PARCEL'
  | 'HYPERLOCAL_RAPIDO'
  | 'HYPERLOCAL_DUNZO'
  | 'OUTSTATION_DELHIVERY';

export type OrderStatus =
  | 'PENDING_EXTRACTION'
  | 'READY_FOR_DISPATCH'
  | 'COMPLETED';

export interface DonorBoard {
  id: string;
  boardName: string;
  category: BoardCategory;
  subModel?: string;
  sellerName: string;
  sellerPhone?: string;
  sellerState?: string;
  sellerDistrict?: string;
  sellerPincode?: string;
  locationCity?: string;
  locationArea: string;
  distanceKm: number;
  primaryFault: string;
  rawBoardPriceInr: number;
  status: BoardStatus;
  imageUrl?: string;
  totalComponentsCount?: number;
  intactComponentsCount?: number;
  createdAt?: string;
}

export interface HarvestableComponent {
  id: string;
  donorBoardId: string;
  partNumber: string;
  partName: string;
  componentCategory: string;
  packageType: string;
  difficulty: ExtractionDifficulty;
  recommendedTempC: number;
  partPriceInr: number;
  extractionFeeInr: number;
  bypassHackTip?: string;
  status: ComponentStatus;
}

export interface Order {
  id: string;
  orderCode: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerState?: string;
  buyerDistrict?: string;
  buyerPincode?: string;
  donorBoardId: string;
  componentId: string | null;
  mode: OrderMode;
  deliveryType: DeliveryType;
  logisticsPartner?: string;
  itemPriceInr: number;
  extractionFeeInr: number;
  deliveryFeeInr: number;
  platformCommissionInr?: number;
  totalPayableInr: number;
  status: OrderStatus;
  multimeterReadingValue: string;
  trackingOrPorterLink?: string;
  upiUtrOrPaymentId?: string;
  paymentUtr?: string;
  createdAt: string;
}

export interface BoardTemplateComponent {
  partNumber: string;
  partName: string;
  componentCategory: string;
  packageType: string;
  difficulty: ExtractionDifficulty;
  recommendedTempC: number;
  partPriceInr: number;
  extractionFeeInr: number;
  bypassHackTip?: string;
}

export interface BoardTemplate {
  id: string;
  templateName: string;
  boardName: string;
  category: BoardCategory;
  defaultRawPriceInr: number;
  defaultPrimaryFaultPartNumber: string;
  components: BoardTemplateComponent[];
}

export type ActiveTab =
  | 'LOGIN'
  | 'MARKETPLACE'
  | 'SELLER_PORTAL'
  | 'TECH_WORKBENCH'
  | 'ORDERS_TRACKER'
  | 'SUPPORT_CONTACT'
  | 'ESG_ANALYTICS';

export type ConnectionMode = 'SUPABASE_CLOUD' | 'LOCAL_FALLBACK';

export type UserRole =
  | 'BUYER_STUDENT'
  | 'SELLER_LAB'
  | 'TECH_PARTNER';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organization: string;
  phone: string;
  defaultAddress: string;
  state?: string;
  district?: string;
  pincode?: string;
  walletBalanceInr: number;
  isSupabaseAuthenticated?: boolean;
  authMethod?: AuthMethod;
}

export type AuthMethod =
  | 'GOOGLE_OAUTH'
  | 'GOOGLE_QUICK'
  | 'PHONE_SMS'
  | 'PHONE_ONSCREEN'
  | 'EMAIL'
  | 'EMAIL_UNCONFIRMED';

export interface SupportTicket {
  id: string;
  ticketCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderCode?: string;
  category: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}
