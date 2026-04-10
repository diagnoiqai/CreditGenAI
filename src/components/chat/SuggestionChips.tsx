import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string, isSuggestion: boolean) => void;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#5A5A40]/30 scrollbar-track-transparent hover:scrollbar-thumb-[#5A5A40]/50">
      {suggestions.slice(0, 8).map((sug, i) => (
        <button
          key={`suggestion-${i}`}
          onClick={() => onSelect(sug, true)}
          className="whitespace-nowrap px-5 py-2.5 rounded-full bg-[#F5F5F0] text-[#5A5A40] text-xs font-bold border border-[#5A5A40]/10 hover:bg-[#5A5A40] hover:text-white transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 group"
        >
          <Sparkles className="w-3 h-3 opacity-50 group-hover:opacity-100" /> {sug}
        </button>
      ))}
    </div>
  );
};
