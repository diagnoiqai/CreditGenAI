import React from 'react';
import { BankData } from '../constants/bankData';

interface BankCardProps {
  bank: BankData;
  onViewDetails: (bank: BankData) => void;
  onApply: (bankName: string) => void;
}

/**
 * Calculate monthly EMI
 */
function calcEMI(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Format rupee amount with lakh/crore notation
 */
function formatLakh(amount: number): string {
  if (amount >= 10_000_000) return "₹" + (amount / 10_000_000).toFixed(1) + " Cr";
  if (amount >= 100_000) return "₹" + (amount / 100_000).toFixed(0) + " L";
  return "₹" + (amount / 1_000).toFixed(0) + "K";
}

/**
 * Format full rupee amount
 */
function formatRupee(amount: number): string {
  const n = Math.round(amount);
  return "₹" + n.toLocaleString("en-IN");
}

/**
 * Get approval status
 */
function getApprovalStyle(pct: number): { bg: string; text: string; label: string } {
  if (pct >= 80) return {
    bg: "bg-[#E6F9F3]",
    text: "text-[#006F47]",
    label: "High"
  };
  if (pct >= 60) return {
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
    label: "Medium"
  };
  return {
    bg: "bg-[#FEE2E2]",
    text: "text-[#991B1B]",
    label: "Low"
  };
}

export const BankCard: React.FC<BankCardProps> = ({ bank, onViewDetails, onApply }) => {
  const emi = calcEMI(bank.maxLoan, bank.rate, bank.maxTenure);
  const approvalStyle = getApprovalStyle(bank.approval);

  return (
    <article
      className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md ${
        bank.badge ? 'border-[#1B6EF3]' : 'border-[#E4EAF4]'
      }`}
    >
      {/* Header: Logo, Name, Badge, Apply */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-[#E4EAF4]">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: bank.logoBg, color: bank.logoText }}
          >
            {bank.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#0D1626] text-sm">{bank.name}</p>
            {bank.badge && (
              <span className="inline-block mt-1 px-2 py-1 bg-[#EBF2FF] text-[#1253C4] text-xs font-bold rounded">
                {bank.badge}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onApply(bank.name)}
          className="px-3 py-2 bg-[#1B6EF3] text-white text-xs font-bold rounded hover:bg-[#0F57D8] transition-colors whitespace-nowrap"
        >
          Apply ↗
        </button>
      </div>

      {/* Hero: Interest Rate | EMI */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-[#E4EAF4]">
        <div>
          <p className="text-xs text-[#8E9BB8] font-semibold uppercase tracking-wide">Interest rate</p>
          <p className="text-2xl font-bold text-[#0D1626] mt-1">
            {bank.rate}<span className="text-sm font-semibold">% p.a.</span>
          </p>
          <p className="text-xs text-[#8E9BB8] mt-1">Fixed rate</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#8E9BB8] font-semibold uppercase tracking-wide">
            EMI from <span className="font-normal">({formatLakh(bank.maxLoan)} · {bank.maxTenure}mo)</span>
          </p>
          <p className="text-2xl font-bold text-[#0D1626] mt-1">
            {formatRupee(emi)}
          </p>
          <p className="text-xs text-[#8E9BB8] mt-1">per month</p>
        </div>
      </div>

      {/* Metrics: Max Loan, Tenure, Approval */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-[#E4EAF4]">
        <MetricItem label="Max loan" value={formatLakh(bank.maxLoan)} />
        <MetricItem label="Tenure" value={`${bank.maxTenure} mo`} />
        <div className="text-right">
          <p className="text-xs text-[#8E9BB8] font-semibold uppercase tracking-wide">Approval</p>
          <p className={`text-sm font-bold mt-2 ${approvalStyle.text} ${approvalStyle.bg} px-2 py-1 rounded inline-block`}>
            ● {bank.approval}% {approvalStyle.label}
          </p>
        </div>
      </div>

      {/* Footer: View Details */}
      <div className="p-4">
        <button
          onClick={() => onViewDetails(bank)}
          className="w-full text-[#1B6EF3] font-bold text-sm hover:text-[#0F57D8] transition-colors flex items-center justify-center gap-2"
        >
          View details
          <span>↑</span>
        </button>
      </div>
    </article>
  );
};

const MetricItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-[#8E9BB8] font-semibold uppercase tracking-wide">{label}</p>
    <p className="text-base font-bold text-[#0D1626] mt-1.5">{value}</p>
  </div>
);
