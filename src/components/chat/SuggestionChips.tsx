import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string, isSuggestion: boolean) => void;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSelect }) => {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-3 no-scrollbar scrollbar-thin scrollbar-thumb-[#5A5A40]/30 scrollbar-track-transparent hover:scrollbar-thumb-[#5A5A40]/50">
      {suggestions.slice(0, 8).map((sug, i) => (
        <button
          key={`suggestion-${i}`}
          onClick={() => onSelect(sug, true)}
          className="whitespace-nowrap px-4 py-1.5 rounded-full bg-[#F5F5F0] text-[#5A5A40] text-[10px] font-bold border border-[#5A5A40]/10 hover:bg-[#5A5A40] hover:text-white transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md active:scale-95 group"
        >
          <Sparkles className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" /> {sug}
        </button>
      ))}
    </div>
  );
};
