export interface Company {
  name: string;
  type: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  phone?: string;
  authMethod?: 'phone_otp' | 'guest';
  userType?: 'guest' | 'phone_verified';
  formCompleted?: boolean;
  formCompletedAt?: string;
  isNewUser?: boolean;
  monthlyIncome?: number;
  employmentType?: 'Salaried' | 'Self-employed';
  companyType?: 'MNC' | 'Public Ltd' | 'Private Ltd' | 'Government/PSU' | 'Proprietorship' | 'Partnership' | 'Other';
  companyName?: string;
  companyTier?: 1 | 2 | 3;
  workExperience?: string;
  totalExperience?: string;
  itrFiled?: boolean;
  annualIncomeITR?: number;
  annualIncomeIdeal?: number;
  yearsOfBusiness?: string;
  city?: string;
  pincode?: string;
  existingEMIs?: number;
  age?: number;
  loanAmountRequired?: number;
  loanType?: LoanType;
  cibilScore?: number;
  gender?: 'Male' | 'Female' | 'Other';
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  lastUpdated?: string;
  lastSeen?: string;
  createdAt?: string;
  sessionId?: string;
  role?: 'admin' | 'staff' | 'user';
  permissions?: {
    canManageBanks: boolean;
    canManageLeads: boolean;
    canManageUsers: boolean;
  };
}

export interface GuestSessionData {
  sessionId: string;
  userType: 'guest';
  createdAt: string;
  expiresAt: string;
  profile: Partial<UserProfile>;
  chatMessages: ChatMessage[];
  formCompleted: boolean;
  readyForConversion: boolean;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  referenceId?: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  isExistingUser: boolean;
  isNewUser: boolean;
  formCompleted: boolean;
  userId?: string;
  sessionToken?: string;
}

export interface OTPStatus {
  status: 'pending' | 'verified' | 'expired' | 'canceled';
  phone: string;
  attempts: number;
}

export interface UserResolution {
  id: string; // phone or sessionId
  type: 'phone' | 'guest';
  profile: UserProfile | null;
  dataSource: 'postgres' | 'localStorage';
  formCompleted: boolean;
  isNewUser: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: {
    type: 'COMPARE_OFFERS' | 'CALCULATE_EMI' | 'ELIGIBILITY_SUMMARY' | 'CHECK_APPLICATION_STATUS' | 'SEARCH_POLICIES';
    data: any;
  };
  suggestions?: string[];
}

export interface ChatSession {
  uid: string;
  messages: ChatMessage[];
  lastUpdated: string;
}

export type LoanType = 'Personal Loan' | 'Home Loan' | 'Car Loan' | 'Jewelry Loan' | 'Business Loan' | 'Loan Against Property';

export interface BankOffer {
  id: string;
  bankName: string;
  aliases?: string[];  // Bank name variations (e.g., 'HDFC', 'hdfc', 'HDFC Bank Ltd')
  loanType: LoanType;
  minAmount: number;
  maxAmount: number;
  minInterestRate: number;
  maxInterestRate: number;
  processingFee: number;
  minTenure: number;
  maxTenure: number;
  minCibilScore: number;
  interestRateBelow750?: number;
  maxAmountPercentBelow750?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  repaymentPolicy?: string;
  preclosureCharges?: string;
  termsConditions?: string;
  minAge?: number;
  maxAge?: number;
  minNetSalaryTier1?: number;
  minNetSalaryTier2?: number;
  employmentType?: 'Salaried' | 'Self-employed' | 'Both';
  minWorkExperience?: string;
  salaryMode?: string;
  foirCap?: number;
  prepaymentCharges?: string;
  foreclosureCharges?: string;
  timeToDisbursal?: string;
  documentsRequired?: string;
  stampDutyFee?: string;
  emiBounceCharges?: string;
  multiplier?: number;
  policyVector?: number[];
  lastUpdated: string;
}

export interface LoanApplication {
  id: string;
  uid: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  bankId: string;
  bankName: string;
  loanType: string;
  loanAmount: number;
  status: 'Pending' | 'Contacted' | 'Approved' | 'Rejected' | 'Interested' | 'Documents Received';
  subStatus?: string;
  statusNotes?: string;
  rejectionReason?: string;
  timestamp: string;
  attachments?: {
    id: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    timestamp: string;
  }[];
}

export interface StaffInvite {
  id: string;
  email: string;
  role: 'staff' | 'admin';
  permissions: {
    canManageBanks: boolean;
    canManageLeads: boolean;
    canManageUsers: boolean;
  };
  invitedBy: string;
  timestamp: string;
}
