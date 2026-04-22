import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string, isSuggestion: boolean) => void;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar scrollbar-thin scrollbar-thumb-[#1B6EF3]/30 scrollbar-track-transparent hover:scrollbar-thumb-[#1B6EF3]/50">
      {suggestions.slice(0, 8).map((sug) => (
        <button
          key={sug}
          onClick={() => onSelect(sug, true)}
          className="whitespace-nowrap px-3 py-2 rounded-lg bg-[#EBF2FF] text-[#1B6EF3] text-xs font-semibold border border-[#C4D9FB] hover:bg-[#D9E8FF] hover:border-[#1B6EF3] transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md active:scale-95 group"
        >
          <Sparkles className="w-3 h-3 opacity-70 group-hover:opacity-100" /> {sug}
        </button>
      ))}
    </div>
  );
};
