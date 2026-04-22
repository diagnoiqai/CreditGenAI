/**
 * data.js — Bank offer data
 *
 * Each bank object has:
 *  id             Unique identifier
 *  name           Bank display name
 *  initials       2-letter abbreviation for the logo circle
 *  logoBg         CSS background color for the logo (use brand color)
 *  logoText       CSS text color for initials
 *  maxLoan        Maximum loan amount in rupees
 *  minLoan        Minimum loan amount in rupees
 *  rate           Eligible interest rate for this user (% p.a.)
 *  minRate        Minimum possible rate (slider floor)
 *  maxTenure      Maximum repayment period in months
 *  minTenure      Minimum repayment period in months
 *  apr            Annual Percentage Rate (includes fees, % p.a.)
 *  processingFee  Processing fee string (shown in details)
 *  processingTime Disbursal time string (shown in details)
 *  approval       Approval chance percentage (0–100)
 *  badge          Short text badge shown on card, or null
 *  docs           Array of required document strings
 */

const BANKS = [
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
