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
    <div className="flex items-center gap-3 bg-[#F9F9F7] p-2 rounded-[32px] border border-gray-100 shadow-inner group focus-within:ring-4 focus-within:ring-[#5A5A40]/5 focus-within:bg-white focus-within:border-[#5A5A40]/20 transition-all">
      <button className="p-3 rounded-full hover:bg-white transition-all text-gray-400 hover:text-[#5A5A40] hover:shadow-sm">
        <Plus className="w-6 h-6" />
      </button>
      <input
        type="text"
        value={input}
        onChange={e => {
          setInput(e.target.value);
          if (onChange) onChange(e.target.value);
        }}
        onKeyDown={e => e.key === 'Enter' && handleSend()}
        placeholder="Ask CreditGenAI about loans, EMI, or eligibility..."
        className="flex-1 bg-transparent outline-none font-sans font-medium text-base px-2 placeholder:text-gray-400"
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || loading}
        className="p-3.5 rounded-full bg-[#5A5A40] text-white hover:bg-[#4A4A30] transition-all disabled:opacity-30 disabled:scale-90 shadow-lg active:scale-95 group"
      >
        <Send className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
};
