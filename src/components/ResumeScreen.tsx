import React from 'react';
import { motion } from 'motion/react';
import { Bot, ArrowRight, RefreshCw } from 'lucide-react';

interface ResumeScreenProps {
  loanType: string;
  onContinue: () => void;
  onStartFresh: () => void;
}

export const ResumeScreen: React.FC<ResumeScreenProps> = ({ loanType, onContinue, onStartFresh }) => {
  return (
    <div className="min-h-app bg-[#F2F5FB] flex items-center justify-center p-6 pt-[calc(1.5rem+var(--safe-top))] pb-[calc(1.5rem+var(--safe-bottom))] font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full text-center border border-[#E4EAF4]"
      >
        <div className="w-16 h-16 bg-[#1B6EF3] rounded-lg flex items-center justify-center text-white mx-auto mb-6 shadow-md">
          <Bot size={32} />
        </div>
        
        <h2 className="text-3xl font-display font-bold mb-3 text-[#0D1626]">Welcome back!</h2>
        <p className="text-[#4A5878] text-base font-medium mb-8">
          Continue your <span className="font-semibold text-[#1B6EF3]">{loanType}</span> application where you left off?
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={onContinue}
            className="w-full bg-[#1B6EF3] text-white py-4 rounded-lg text-base font-semibold hover:bg-[#0F57D8] transition-all flex items-center justify-center gap-2 group shadow-md active:scale-95"
          >
            Continue Application <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={onStartFresh}
            className="w-full border-2 border-[#E4EAF4] text-[#1B6EF3] py-4 rounded-lg text-base font-semibold hover:bg-[#F7F9FD] hover:border-[#1B6EF3] transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <RefreshCw className="w-5 h-5" /> Start Fresh
          </button>
        </div>
      </motion.div>
    </div>
  );
};
