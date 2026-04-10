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
  scrollRef: React.RefObject<HTMLDivElement>;
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`flex gap-4 w-full ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 ${m.role === 'user' ? 'bg-[#5A5A40] text-white' : 'bg-white border border-[#5A5A40]/10 text-[#5A5A40]'}`}>
              {m.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
            </div>
            <div className={`p-5 md:p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm transition-all flex-1 ${m.role === 'user' ? 'bg-[#5A5A40] text-white rounded-tr-none' : 'bg-white/80 text-[#1a1a1a] rounded-tl-none border border-white/50'}`}>
              <div className="prose prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-headings:font-serif prose-strong:text-inherit">
                <Markdown>{m.content}</Markdown>
              </div>
              {m.action && (
                <div className="mt-6 pt-6 border-t border-gray-50/50">
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
              <div className={`flex items-center gap-2 mt-4 opacity-40 ${m.role === 'user' ? 'justify-end' : ''}`}>
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-medium">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
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
