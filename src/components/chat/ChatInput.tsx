import React, { useState } from 'react';
import { Send, Plus } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  loading: boolean;
  onChange?: (text: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, loading, onChange }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input);
    setInput('');
    if (onChange) onChange('');
  };

  return (
    <div className="flex items-center gap-3 bg-white p-2 rounded-[28px] border border-[#5A5A40]/10 shadow-[0_10px_40px_rgba(0,0,0,0.04)] group focus-within:ring-4 focus-within:ring-[#5A5A40]/5 focus-within:border-[#5A5A40]/30 transition-all duration-300">
      <button className="hidden md:flex p-3 rounded-2xl bg-[#F5F5F0] hover:bg-[#F0F0E5] transition-all text-[#5A5A40]/60 hover:text-[#5A5A40] border border-transparent hover:border-[#5A5A40]/10 shadow-sm">
        <Plus className="w-5 h-5" />
      </button>
      <div className="flex-1 px-2">
        <input
          type="text"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            if (onChange) onChange(e.target.value);
          }}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about interest rates, preclosure policies..."
          className="w-full bg-transparent outline-none font-sans font-medium text-sm md:text-base placeholder:text-gray-300 text-gray-700"
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!input.trim() || loading}
        className="p-3.5 md:p-4 rounded-[22px] bg-[#5A5A40] text-white hover:bg-[#4A4A30] transition-all disabled:opacity-20 disabled:grayscale shadow-lg active:scale-95 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
        <Send className="w-5 h-5 md:w-6 md:h-6 relative z-10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
};
