/**
 * Bank offer data constants
 * Includes all bank details, loan parameters, and documents required
 */

export interface BankData {
  id: number;
  name: string;
  initials: string;
  logoBg: string;
  logoText: string;
  maxLoan: number;
  minLoan: number;
  rate: number;
  minRate: number;
  maxTenure: number;
  minTenure: number;
  apr: number;
  processingFee: string;
  processingTime: string;
  approval: number;
  badge: string | null;
  docs: string[];
}

export const BANKS: BankData[] = [
  {
    id: 1,
    name: "HDFC Bank",
    initials: "HD",
    logoBg: "#EBF2FF",
    logoText: "#1253C4",
    maxLoan: 2500000,
    minLoan: 100000,
    rate: 10.75,
    minRate: 10.75,
    maxTenure: 60,
    minTenure: 12,
    apr: 11.20,
    processingFee: "1.5% + GST",
    processingTime: "2–3 days",
    approval: 85,
    badge: "Best match",
    docs: [
      "Last 3 months salary slips",
      "Last 6 months bank statement",
      "PAN Card",
      "Aadhaar Card",
      "Form 16 / ITR",
    ],
  },
  {
    id: 2,
    name: "ICICI Bank",
    initials: "IC",
    logoBg: "#FEF3C7",
    logoText: "#92400E",
    maxLoan: 2000000,
    minLoan: 100000,
    rate: 11.25,
    minRate: 11.25,
    maxTenure: 60,
    minTenure: 12,
    apr: 11.85,
    processingFee: "2% + GST",
    processingTime: "3–5 days",
    approval: 72,
    badge: null,
    docs: [
      "Last 3 months salary slips",
      "Last 6 months bank statement",
      "PAN Card",
      "Aadhaar Card",
    ],
  },
  {
    id: 3,
    name: "SBI Personal Loan",
    initials: "SB",
    logoBg: "#F0F1F5",
    logoText: "#4A5878",
    maxLoan: 1500000,
    minLoan: 100000,
    rate: 10.90,
    minRate: 10.90,
    maxTenure: 48,
    minTenure: 12,
    apr: 11.40,
    processingFee: "1% + GST",
    processingTime: "5–7 days",
    approval: 65,
    badge: null,
    docs: [
      "Last 3 months salary slips",
      "Last 6 months bank statement",
      "PAN Card",
      "Aadhaar Card",
      "Form 16",
    ],
  },
];
