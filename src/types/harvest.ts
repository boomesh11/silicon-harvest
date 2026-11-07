export type BoardCategory =
  | 'IC_MICROCONTROLLERS'
  | 'WASHING_MACHINE_APPLIANCE'
  | 'BATTERIES_POWER_CELLS'
  | 'SMPS_POWER_INVERTERS'
  | 'LAPTOP_MOBILE_MOTHERBOARDS'
  | 'MOTORS_ROBOTICS_CNC'
  | 'DISPLAYS_SENSORS_MODULES'
  | 'AUDIO_TV_CONSUMER'
  | 'ACADEMIC_MAKER'
  | 'POWER_SMPS'
  | 'APPLIANCE_PCB'
  | 'LAPTOP_MOBILE';

export type BoardStatus =
  | 'AVAILABLE'
  | 'PARTIALLY_HARVESTED'
  | 'SOLD_RAW';

export type ExtractionDifficulty =
  | 'LEVEL_1_PLUG_PULL'
  | 'LEVEL_2_BASIC_IRON'
  | 'LEVEL_2_THROUGH_HOLE'
  | 'LEVEL_3_HOT_AIR_SMD'
  | 'LEVEL_4_BGA_REWORK';

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
  | 'OUTSTATION_DELHIVERY'
  | 'HYPERLOCAL_BIKE'
  | 'DIRECT_HANDOFF'
  | 'OUTSTATION_SPEEDPOST';

export type OrderStatus =
  | 'CONFIRMED'
  | 'PENDING_EXTRACTION'
  | 'PICKED_UP_BY_PARTNER'
  | 'READY_FOR_DISPATCH'
  | 'DELIVERED'
  | 'COMPLETED';

export type HardwareMode =
  | 'READY_TO_USE'
  | 'SOLDERED_RAW'
  | 'BOTH';

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
  sellerFullAddress?: string;
  distanceKm: number;
  primaryFault: string;
  rawBoardPriceInr: number;
  desolderedPriceInr?: number;
  hardwareMode?: HardwareMode;
  allowBargain?: boolean;
  isVerified?: boolean;
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
  totalPriceInr?: number;
  status: OrderStatus;
  multimeterReadingValue: string;
  trackingOrPorterLink?: string;
  upiUtrOrPaymentId?: string;
  paymentUtr?: string;
  isProOrder?: boolean;
  bargainDiscountInr?: number;
  createdAt: string;
}

export interface BargainOffer {
  id: string;
  boardId: string;
  boardName: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerDistrict: string;
  sellerName: string;
  sellerPhone: string;
  sellerDistrict: string;
  originalPriceInr: number;
  offeredPriceInr: number;
  note?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
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
  | 'MARKETPLACE'
  | 'SELLER_PORTAL'
  | 'ORDERS_TRACKER'
  | 'MEMBERSHIP'
  | 'SUPPORT_CONTACT'
  | 'OWNER_ADMIN'
  | 'LOGIN'
  | 'TECH_WORKBENCH'
  | 'ESG_ANALYTICS';

export type ConnectionMode = 'SUPABASE_CLOUD' | 'LOCAL_FALLBACK';

export type UserRole =
  | 'BUYER_STUDENT'
  | 'SELLER_LAB'
  | 'TECH_PARTNER'
  | 'OWNER_ADMIN';

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
  isProMember?: boolean;
  proMembershipExpiry?: string;
  isOwnerAdmin?: boolean;
  isSupabaseAuthenticated?: boolean;
  authMethod?: AuthMethod;
}

export type AuthMethod =
  | 'GOOGLE_OAUTH'
  | 'GOOGLE_QUICK'
  | 'PHONE_SMS'
  | 'PHONE_ONSCREEN'
  | 'EMAIL'
  | 'EMAIL_UNCONFIRMED'
  | 'OWNER_OVERRIDE';

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
