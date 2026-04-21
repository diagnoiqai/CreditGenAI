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
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-6 font-serif">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded-[60px] shadow-2xl max-w-xl w-full text-center border border-[#5A5A40]/10"
      >
        <div className="w-20 h-20 bg-[#5A5A40] rounded-[30px] flex items-center justify-center text-white mx-auto mb-8 shadow-inner">
          <Bot size={40} />
        </div>
        
        <h2 className="text-4xl font-bold mb-4">Welcome back!</h2>
        <p className="text-[#5A5A40] text-lg italic mb-10">
          Continue your <span className="font-bold underline">{loanType}</span> application where you left off?
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={onContinue}
            className="w-full bg-[#5A5A40] text-white py-5 rounded-full text-xl font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-3 group shadow-xl"
          >
            Continue Application <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={onStartFresh}
            className="w-full border-2 border-[#5A5A40]/20 text-[#5A5A40] py-5 rounded-full text-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
          >
            <RefreshCw size={20} /> Start Fresh
          </button>
        </div>
      </motion.div>
    </div>
  );
};
