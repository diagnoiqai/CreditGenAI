import React from 'react';
import { motion } from 'motion/react';
import { LoanType } from '../../types';
import { CheckCircle2 } from 'lucide-react';

interface LoanTypeStepProps {
  loanTypes: LoanType[];
  selectedType?: LoanType;
  onSelect: (type: LoanType) => void;
  error?: string;
}

export const LoanTypeStep: React.FC<LoanTypeStepProps> = ({ loanTypes, selectedType, onSelect, error }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-3xl font-serif font-bold mb-2">What are you looking for?</h2>
        <p className="text-[#5A5A40] font-serif italic">Select the type of loan that fits your needs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loanTypes.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`
              p-6 rounded-3xl border-2 transition-all text-left relative group
              ${selectedType === type 
                ? 'border-[#5A5A40] bg-[#5A5A40]/5 shadow-xl scale-[1.02]' 
                : 'border-[#5A5A40]/10 hover:border-[#5A5A40]/30 hover:bg-white shadow-sm'}
            `}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`
                w-10 h-10 rounded-2xl flex items-center justify-center transition-colors
                ${selectedType === type ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F5F0] text-[#5A5A40] group-hover:bg-[#5A5A40]/10'}
              `}>
                {/* Icon mapping would go here if needed */}
              </div>
              {selectedType === type && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="text-[#5A5A40] w-6 h-6" />
                </motion.div>
              )}
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1a1a1a]">{type}</h3>
            <p className="text-xs text-[#5A5A40]/60 font-sans uppercase tracking-widest mt-1">
              {type === 'Personal Loan' ? 'For any personal needs' : 
               type === 'Home Loan' ? 'Buy your dream home' :
               type === 'Car Loan' ? 'Drive your new car' :
               type === 'Jewelry Loan' ? 'Against your gold' : 'Grow your business'}
            </p>
          </button>
        ))}
      </div>
      {error && <p className="text-red-500 text-center text-sm font-bold uppercase tracking-widest">{error}</p>}
    </motion.div>
  );
};
