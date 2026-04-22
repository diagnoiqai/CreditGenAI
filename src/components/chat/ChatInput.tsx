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
    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-[#E4EAF4] shadow-sm group focus-within:ring-2 focus-within:ring-[#1B6EF3]/20 focus-within:border-[#1B6EF3] transition-all duration-300">
      <button className="hidden md:flex p-3 rounded-lg bg-[#F2F5FB] hover:bg-[#E8EFF8] transition-all text-[#4A5878] hover:text-[#1B6EF3] border border-transparent hover:border-[#E4EAF4] shadow-sm">
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
          className="w-full bg-transparent outline-none font-sans font-medium text-sm md:text-base placeholder:text-[#8E9BB8] text-[#0D1626]"
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!input.trim() || loading}
        className="p-3 md:p-4 rounded-lg bg-[#1B6EF3] text-white hover:bg-[#0F57D8] transition-all disabled:opacity-40 disabled:grayscale shadow-md active:scale-95 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
        <Send className="w-5 h-5 md:w-6 md:h-6 relative z-10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
};
