import React from 'react';
import { ChatMessage, UserProfile, BankOffer, LoanApplication } from '../../types';
import { User, Bot, Clock } from 'lucide-react';
import Markdown from 'react-markdown';
import { ActionRenderer } from './ActionRenderer';

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  profile: UserProfile;
  bankOffers: BankOffer[];
  userApplications: LoanApplication[];
  onApply: (offer: BankOffer) => void;
  onAskAI: (text: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, loading, profile, bankOffers, userApplications, onApply, onAskAI, scrollRef 
}) => {
  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto py-3 md:py-10 px-3 md:px-6 space-y-6 md:space-y-8 bg-[#F2F5FB]/20 relative scroll-smooth"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1B6EF3 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      {messages.map((m, i) => (
        <div
          key={`${m.timestamp}-${m.role}-${m.content.slice(0, 24)}`}
          className={`flex items-start gap-2 md:gap-4 ${m.role === 'user' ? 'flex-row-reverse pl-2 md:pl-12' : 'flex-row pr-2 md:pr-12'}`}
        >
          {/* Avatar Area */}
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 border ${
            m.role === 'user' 
              ? 'bg-[#1B6EF3] text-white border-[#1B6EF3]' 
              : 'bg-white border-[#E4EAF4] text-[#1B6EF3]'
          }`}>
            {m.role === 'user' ? <User size={18} className="md:w-6 md:h-6" /> : <Bot size={18} className="md:w-6 md:h-6" />}
          </div>

          {/* Bubble Area */}
          <div className="flex flex-col max-w-full">
            <div className={`relative px-5 py-3 md:px-7 md:py-4 rounded-2xl md:rounded-2xl shadow-sm backdrop-blur-sm transition-all ${
              m.role === 'user' 
                ? 'bg-[#1B6EF3] text-white rounded-tr-none' 
                : 'bg-white text-[#0D1626] rounded-tl-none border border-[#E4EAF4]'
            }`}>
              {/* Message Content */}
              <div className={`prose prose-sm md:prose-base max-w-none leading-relaxed prose-a:no-underline ${
                m.role === 'user' ? 'prose-invert' : 'prose-headings:font-display prose-headings:font-bold prose-headings:text-[#0D1626]'
              }`}>
                <Markdown>{m.content}</Markdown>
              </div>

              {/* Action Area (only for bot) */}
              {m.role === 'assistant' && m.action && (
                <div className="mt-4">
                  <ActionRenderer 
                    action={m.action}
                    profile={profile}
                    bankOffers={bankOffers}
                    userApplications={userApplications}
                    onApply={onApply}
                    onAskAI={onAskAI}
                  />
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div className={`flex items-center gap-1.5 mt-2 opacity-20 ${m.role === 'user' ? 'justify-end pr-2' : 'pl-2'}`}>
              <Clock size={10} />
              <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex justify-start">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#E4EAF4] flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6 text-[#1B6EF3]" />
            </div>
            <div className="bg-white px-6 py-4 rounded-full border border-[#E4EAF4] shadow-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#1B6EF3] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[#1B6EF3] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[#1B6EF3] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
