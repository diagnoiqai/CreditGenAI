import React from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../../types';
import { IndianRupee, CreditCard, TrendingUp } from 'lucide-react';

interface FinancialsStepProps {
  formData: Partial<UserProfile>;
  updateField: (field: keyof UserProfile, value: any) => void;
  errors: Record<string, string>;
}

export const FinancialsStep: React.FC<FinancialsStepProps> = ({
  formData,
  updateField,
  errors
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-3xl font-serif font-bold mb-2">Financial Overview</h2>
        <p className="text-[#5A5A40] font-serif italic">Help us understand your financial capacity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Monthly Income */}
        <div className="space-y-3">
          <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
            <IndianRupee className="w-4 h-4" /> Monthly Net Take-Home
          </label>
          <div className="relative">
            <input
              type="number"
              name="monthlyIncome"
              value={formData.monthlyIncome || ''}
              onChange={(e) => updateField('monthlyIncome', Number(e.target.value))}
              placeholder="e.g. 50000"
              className={`w-full p-4 pl-12 rounded-2xl border-2 outline-none transition-all font-serif font-bold text-[#1a1a1a] ${errors.monthlyIncome ? 'border-red-500' : 'border-[#5A5A40]/10 focus:border-[#5A5A40]'}`}
            />
            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40 w-5 h-5" />
          </div>
          {errors.monthlyIncome && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{errors.monthlyIncome}</p>}
          <p className="text-[10px] text-[#5A5A40]/60 font-sans uppercase tracking-widest">Your monthly salary after all deductions.</p>
        </div>

        {/* Existing EMIs */}
        <div className="space-y-3">
          <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Total Existing EMIs
          </label>
          <div className="relative">
            <input
              type="number"
              name="existingEMIs"
              value={formData.existingEMIs || 0}
              onChange={(e) => updateField('existingEMIs', Number(e.target.value))}
              className="w-full p-4 pl-12 rounded-2xl border-2 border-[#5A5A40]/10 focus:border-[#5A5A40] outline-none transition-all font-serif font-bold text-[#1a1a1a]"
            />
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40 w-5 h-5" />
          </div>
          <p className="text-[10px] text-[#5A5A40]/60 font-sans uppercase tracking-widest">Sum of all your current monthly loan payments.</p>
        </div>

        {/* Loan Amount Required */}
        <div className="space-y-3">
          <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Loan Amount Required
          </label>
          <div className="relative">
            <input
              type="number"
              name="loanAmountRequired"
              value={formData.loanAmountRequired || ''}
              onChange={(e) => updateField('loanAmountRequired', Number(e.target.value))}
              placeholder="e.g. 500000"
              className={`w-full p-4 pl-12 rounded-2xl border-2 outline-none transition-all font-serif font-bold text-[#1a1a1a] ${errors.loanAmountRequired ? 'border-red-500' : 'border-[#5A5A40]/10 focus:border-[#5A5A40]'}`}
            />
            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40 w-5 h-5" />
          </div>
          {errors.loanAmountRequired && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{errors.loanAmountRequired}</p>}
        </div>

        {/* CIBIL Score */}
        <div className="space-y-3">
          <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Estimated CIBIL Score
          </label>
          <div className="relative">
            <input
              type="number"
              name="cibilScore"
              value={formData.cibilScore || ''}
              onChange={(e) => updateField('cibilScore', Number(e.target.value))}
              placeholder="e.g. 750"
              className="w-full p-4 pl-12 rounded-2xl border-2 border-[#5A5A40]/10 focus:border-[#5A5A40] outline-none transition-all font-serif font-bold text-[#1a1a1a]"
            />
            <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40 w-5 h-5" />
          </div>
          <p className="text-[10px] text-[#5A5A40]/60 font-sans uppercase tracking-widest">If unknown, enter 750 as an estimate.</p>
        </div>
      </div>
    </motion.div>
  );
};
