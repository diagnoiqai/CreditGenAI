import React from 'react';
import { ChatMessage, UserProfile, BankOffer, LoanApplication } from '../../types';
import { motion } from 'motion/react';
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
      className="h-full overflow-y-auto py-6 md:py-10 space-y-8 bg-[#F5F5F0]/20 relative scroll-smooth"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#5A5A40 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      {messages.map((m, i) => (
        <motion.div
          key={`chat-msg-${m.role}-${i}`}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className={`flex items-start gap-3 md:gap-4 ${m.role === 'user' ? 'flex-row-reverse pl-12' : 'flex-row pr-12'}`}
        >
          {/* Avatar Area */}
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 border ${
            m.role === 'user' 
              ? 'bg-[#5A5A40] text-white border-[#5A5A40]' 
              : 'bg-white border-[#5A5A40]/10 text-[#5A5A40]'
          }`}>
            {m.role === 'user' ? <User size={18} className="md:w-6 md:h-6" /> : <Bot size={18} className="md:w-6 md:h-6" />}
          </div>

          {/* Bubble Area */}
          <div className="flex flex-col max-w-full">
            <div className={`relative px-5 py-4 md:px-7 md:py-5 rounded-[24px] md:rounded-[32px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] backdrop-blur-sm transition-all ${
              m.role === 'user' 
                ? 'bg-[#5A5A40] text-white rounded-tr-none' 
                : 'bg-white/90 text-[#2D2D2D] rounded-tl-none border border-white'
            }`}>
              {/* Message Content */}
              <div className={`prose prose-sm md:prose-base max-w-none leading-relaxed ${
                m.role === 'user' ? 'prose-invert' : 'prose-headings:font-serif prose-headings:italic'
              }`}>
                <Markdown>{m.content}</Markdown>
              </div>

              {/* Action Area (only for bot) */}
              {m.role === 'assistant' && m.action && (
                <div className="mt-6 pt-5 border-t border-gray-100/50">
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
            <div className={`flex items-center gap-1.5 mt-2 opacity-30 ${m.role === 'user' ? 'justify-end pr-2' : 'pl-2'}`}>
              <Clock size={10} />
              <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#5A5A40]/10 flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6 text-[#5A5A40]" />
            </div>
            <div className="bg-white px-6 py-4 rounded-full border border-gray-50 shadow-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#5A5A40] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[#5A5A40] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[#5A5A40] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
