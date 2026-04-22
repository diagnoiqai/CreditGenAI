import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { BankData } from '../constants/bankData';

interface BankDetailModalProps {
  bank: BankData | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (bankName: string) => void;
}

/**
 * Calculate monthly EMI using standard amortisation formula
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
 * Format full rupee amount with comma separation
 */
function formatRupee(amount: number): string {
  const n = Math.round(amount);
  return "₹" + n.toLocaleString("en-IN");
}

/**
 * Get approval status style
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

export const BankDetailModal: React.FC<BankDetailModalProps> = ({
  bank,
  isOpen,
  onClose,
  onApply
}) => {
  const [loanAmount, setLoanAmount] = useState(bank?.maxLoan ?? 500000);
  const [tenure, setTenure] = useState(bank?.maxTenure ?? 60);
  const [interestRate, setInterestRate] = useState(bank?.rate ?? 10.75);

  if (!bank || !isOpen) return null;

  const emi = calcEMI(loanAmount, interestRate, tenure);
  const totalInt = emi * tenure - loanAmount;
  const approvalStyle = getApprovalStyle(bank.approval);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto px-safe">
        <div className="bg-white rounded-t-3xl shadow-2xl max-h-[calc(var(--app-height)-var(--safe-top)-var(--safe-bottom)-1rem)] overflow-y-auto">
          {/* Sheet Header */}
          <div className="sticky top-0 bg-white border-b border-[#E4EAF4] px-6 py-5 rounded-t-3xl flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: bank.logoBg, color: bank.logoText }}
              >
                {bank.initials}
              </div>
              <div>
                <p className="font-bold text-[#0D1626]">{bank.name}</p>
                <p className={`text-xs font-bold ${approvalStyle.text} ${approvalStyle.bg} px-2 py-1 rounded inline-block mt-1`}>
                  ● {bank.approval}% approval — {approvalStyle.label}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F7F9FD] rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-[#4A5878]" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Overview Section */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#4A5878] mb-4">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <OverviewCell
                  label="Interest rate"
                  value={`${bank.rate}%`}
                  unit="p.a."
                  highlighted
                />
                <OverviewCell
                  label="APR"
                  value={`${bank.apr}%`}
                  unit="p.a."
                />
                <OverviewCell
                  label="Processing fee"
                  value={bank.processingFee}
                  small
                />
                <OverviewCell
                  label="Disbursal time"
                  value={bank.processingTime}
                  small
                />
              </div>
            </section>

            {/* Simulator Section */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#4A5878] mb-6">What-if simulator</h2>
              
              {/* Loan Amount Slider */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-[#0D1626]">Loan amount</label>
                  <span className="text-lg font-bold text-[#1B6EF3]">{formatLakh(loanAmount)}</span>
                </div>
                <input
                  type="range"
                  min={bank.minLoan}
                  max={bank.maxLoan}
                  step={50000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#C8D3E8] rounded-full appearance-none cursor-pointer slider"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-[#8E9BB8]">
                  <span>{formatLakh(bank.minLoan)}</span>
                  <span>{formatLakh(bank.maxLoan)}</span>
                </div>
              </div>

              {/* Tenure Slider */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-[#0D1626]">Tenure</label>
                  <span className="text-lg font-bold text-[#1B6EF3]">{tenure} months</span>
                </div>
                <input
                  type="range"
                  min={bank.minTenure}
                  max={bank.maxTenure}
                  step={6}
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#C8D3E8] rounded-full appearance-none cursor-pointer slider"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-[#8E9BB8]">
                  <span>{bank.minTenure} mo</span>
                  <span>{bank.maxTenure} mo</span>
                </div>
              </div>

              {/* Interest Rate Slider */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-[#0D1626]">Interest rate</label>
                  <span className="text-lg font-bold text-[#1B6EF3]">{interestRate.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min={bank.minRate}
                  max={18}
                  step={0.25}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#C8D3E8] rounded-full appearance-none cursor-pointer slider"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-[#8E9BB8]">
                  <span>{bank.minRate}%</span>
                  <span>18%</span>
                </div>
              </div>

              {/* Simulation Results */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-[#F7F9FD] rounded-lg border border-[#E4EAF4]">
                <ResultCell label="Monthly EMI" value={formatRupee(emi)} highlighted />
                <ResultCell label="Principal" value={formatLakh(loanAmount)} />
                <ResultCell label="Interest" value={formatRupee(totalInt)} />
              </div>
            </section>

            {/* Documents Section */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#4A5878] mb-4">Documents required</h2>
              <ul className="space-y-3">
                {(bank.docs && bank.docs.length > 0) ? (
                  bank.docs.map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Check size={16} className="text-[#00A86B]" />
                      </div>
                      <span className="text-sm text-[#4A5878]">{doc}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-[#8E9BB8]">No documents listed</li>
                )}
              </ul>
            </section>

            {/* Apply Button */}
            <div className="pb-[calc(1rem+var(--safe-bottom))]">
              <button
                onClick={() => {
                  onApply?.(bank.name);
                  onClose();
                }}
                className="w-full bg-[#1B6EF3] text-white font-bold py-4 rounded-lg hover:bg-[#0F57D8] transition-colors shadow-lg"
              >
                Apply now with {bank.name} ↗
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slider styles */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #1B6EF3;
          border: 2.5px solid white;
          box-shadow: 0 1px 4px rgba(27, 110, 243, 0.35);
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #1B6EF3;
          border: 2.5px solid white;
          box-shadow: 0 1px 4px rgba(27, 110, 243, 0.35);
          cursor: pointer;
        }
      `}</style>
    </>
  );
};

const OverviewCell: React.FC<{
  label: string;
  value: string;
  unit?: string;
  highlighted?: boolean;
  small?: boolean;
}> = ({ label, value, unit, highlighted, small }) => (
  <div className="border border-[#E4EAF4] rounded-lg p-4 bg-white">
    <p className="text-xs font-semibold text-[#8E9BB8] uppercase tracking-wide">{label}</p>
    <div className="mt-2 flex items-baseline gap-1">
      <p className={`font-bold ${highlighted ? 'text-[#1B6EF3]' : 'text-[#0D1626]'} ${small ? 'text-sm' : 'text-lg'}`}>
        {value}
      </p>
      {unit && <span className={`font-semibold ${small ? 'text-xs' : 'text-sm'} text-[#8E9BB8]`}>{unit}</span>}
    </div>
  </div>
);

const ResultCell: React.FC<{
  label: string;
  value: string;
  highlighted?: boolean;
}> = ({ label, value, highlighted }) => (
  <div className="text-center">
    <p className="text-xs font-bold uppercase text-[#8E9BB8] mb-1">{label}</p>
    <p className={`font-bold ${highlighted ? 'text-[#1B6EF3] text-lg' : 'text-[#0D1626]'}`}>
      {value}
    </p>
  </div>
);
