import React, { useState, useEffect } from 'react';
import { IndianRupee, Percent, Calendar, Calculator } from 'lucide-react';
import { motion } from 'motion/react';

interface LoanCalculatorProps {
  initialAmount?: number;
  initialRate?: number;
  initialTenure?: number;
  bankName?: string;
  onApply?: (amount: number, rate: number, tenure: number) => void;
}

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({
  initialAmount = 500000,
  initialRate = 10.5,
  initialTenure = 60,
  bankName,
  onApply
}) => {
  const [amount, setAmount] = useState(initialAmount);
  const [rate, setRate] = useState(initialRate);
  const [tenure, setTenure] = useState(initialTenure);
  const [emi, setEmi] = useState(0);

  useEffect(() => {
    const monthlyRate = rate / 12 / 100;
    const calculatedEmi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    setEmi(Math.round(calculatedEmi));
  }, [amount, rate, tenure]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#5A5A40]/20 shadow-lg overflow-hidden max-w-sm w-full"
    >
      <div className="bg-[#5A5A40] p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-4 h-4" />
          <h3 className="font-serif font-bold text-base">
            {bankName ? `${bankName} EMI` : 'EMI Calculator'}
          </h3>
        </div>
        <p className="text-white/70 text-[8px] font-sans uppercase tracking-widest">
          Adjust sliders to see monthly commitment
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Loan Amount */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-serif font-bold text-[#5A5A40] flex items-center gap-1">
              <IndianRupee className="w-3 h-3" /> Amount
            </label>
            <span className="text-sm font-serif font-bold text-[#1a1a1a]">
              {formatCurrency(amount)}
            </span>
          </div>
          <input
            type="range"
            min="50000"
            max="5000000"
            step="10000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-1 bg-[#F5F5F0] rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
          />
          <div className="flex justify-between text-[8px] text-gray-400 font-sans uppercase tracking-tighter">
            <span>₹50K</span>
            <span>₹50L</span>
          </div>
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-serif font-bold text-[#5A5A40] flex items-center gap-1">
              <Percent className="w-3 h-3" /> Rate (p.a)
            </label>
            <span className="text-sm font-serif font-bold text-[#1a1a1a]">
              {rate}%
            </span>
          </div>
          <input
            type="range"
            min="8"
            max="24"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-1 bg-[#F5F5F0] rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
          />
          <div className="flex justify-between text-[8px] text-gray-400 font-sans uppercase tracking-tighter">
            <span>8%</span>
            <span>24%</span>
          </div>
        </div>

        {/* Tenure */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-serif font-bold text-[#5A5A40] flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Tenure
            </label>
            <span className="text-sm font-serif font-bold text-[#1a1a1a]">
              {tenure} Mo
            </span>
          </div>
          <input
            type="range"
            min="12"
            max="84"
            step="1"
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full h-1 bg-[#F5F5F0] rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
          />
          <div className="flex justify-between text-[8px] text-gray-400 font-sans uppercase tracking-tighter">
            <span>12 Mo</span>
            <span>84 Mo</span>
          </div>
        </div>

        {/* Result Card */}
        <div className="bg-[#F5F5F0] rounded-xl p-4 text-center border border-[#5A5A40]/10">
          <p className="text-[8px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold mb-0.5">
            Monthly EMI
          </p>
          <h4 className="text-2xl font-serif font-bold text-[#5A5A40]">
            {formatCurrency(emi)}
          </h4>
          <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-[#5A5A40]/10">
            <div>
              <p className="text-[7px] text-gray-400 uppercase tracking-tighter">Interest</p>
              <p className="text-xs font-serif font-bold text-[#1a1a1a]">
                {formatCurrency((emi * tenure) - amount)}
              </p>
            </div>
            <div>
              <p className="text-[7px] text-gray-400 uppercase tracking-tighter">Total</p>
              <p className="text-xs font-serif font-bold text-[#1a1a1a]">
                {formatCurrency(emi * tenure)}
              </p>
            </div>
          </div>
        </div>

        {onApply && (
          <button
            onClick={() => onApply(amount, rate, tenure)}
            className="w-full py-2.5 bg-[#5A5A40] text-white rounded-xl text-xs font-sans uppercase tracking-widest hover:bg-[#4A4A30] transition-all shadow-md active:scale-95"
          >
            Apply Now
          </button>
        )}
      </div>
    </motion.div>
  );
};
