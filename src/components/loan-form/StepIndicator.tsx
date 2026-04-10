import React from 'react';
import { motion } from 'motion/react';

interface StepIndicatorProps {
  steps: { title: string; icon: React.ReactNode }[];
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex justify-between mb-12 relative overflow-x-auto pb-4 scrollbar-hide">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#5A5A40]/10 -translate-y-1/2" />
      {steps.map((s, i) => (
        <div key={i} className="relative z-10 flex flex-col items-center gap-2 min-w-[80px]">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
            ${i <= currentStep ? 'bg-[#5A5A40] text-white shadow-lg scale-110' : 'bg-white text-[#5A5A40]/40 border-2 border-[#5A5A40]/10'}
          `}>
            {s.icon}
          </div>
          <span className={`text-[10px] font-sans uppercase tracking-widest font-bold ${i <= currentStep ? 'text-[#5A5A40]' : 'text-[#5A5A40]/40'}`}>
            {s.title}
          </span>
        </div>
      ))}
    </div>
  );
};
