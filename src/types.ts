export interface Company {
  name: string;
  type: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  monthlyIncome?: number;
  employmentType?: 'Salaried' | 'Self-employed';
  companyType?: 'MNC' | 'Public Ltd' | 'Private Ltd' | 'Proprietorship' | 'Partnership' | 'Other';
  companyName?: string;
  companyTier?: 1 | 2 | 3;
  workExperience?: string;
  totalExperience?: string;
  city?: string;
  existingEMIs?: number;
  age?: number;
  loanAmountRequired?: number;
  loanType?: LoanType;
  cibilScore?: number;
  mobile?: string;
  gender?: 'Male' | 'Female' | 'Other';
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  lastUpdated?: string;
  lastSeen?: string;
  createdAt?: string;
  role?: 'admin' | 'staff' | 'user';
  permissions?: {
    canManageBanks: boolean;
    canManageLeads: boolean;
    canManageUsers: boolean;
  };
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

export type LoanType = 'Personal Loan' | 'Home Loan' | 'Car Loan' | 'Jewelry Loan' | 'Business Loan';

export interface BankOffer {
  id: string;
  bankName: string;
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
  userMobile?: string;
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
