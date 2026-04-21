import React, { useState, useEffect } from 'react';
import { UserProfile, BankOffer } from '../types';
import { apiService } from '../services/apiService';
import { ChatWindow } from './ChatWindow';
import { OffersMarketplace } from './OffersMarketplace';
import { ChatFormCollector } from './ChatFormCollector';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, LayoutGrid, ChevronRight, ChevronLeft, Sparkles, X, Bot, FileText, Lock, ShieldCheck } from 'lucide-react';
import { ChatMessage } from '../types';

interface DashboardProps {
  profile: UserProfile;
  isFormMode?: boolean;
  onFormComplete?: (profile: Partial<UserProfile>) => void;
  onLoginRequest?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, isFormMode = false, onFormComplete, onLoginRequest }) => {
  const [bankOffers, setBankOffers] = useState<BankOffer[]>([]);
  const [highlightedBankIds, setHighlightedBankIds] = useState<string[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(isFormMode); // On mobile, show chat first if filling form
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatTrigger, setChatTrigger] = useState<string | null>(null);

  useEffect(() => {
    // Reset trigger after a short delay so it can be re-triggered
    if (chatTrigger) {
      const timer = setTimeout(() => setChatTrigger(null), 500);
      return () => clearTimeout(timer);
    }
  }, [chatTrigger]);
  useEffect(() => {
    if (!isFormMode) setShowChatOnMobile(false);
  }, [isFormMode]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offers = await apiService.getBankOffers();
        setBankOffers(offers);
      } catch (err) {
        console.error('Failed to fetch offers:', err);
      }
    };
    fetchOffers();
  }, []);

  // Listen for custom events from Gemini action handler
  const handleAIAction = (data: any) => {
    if (data?.bankIds && data.bankIds.length > 0) {
      setHighlightedBankIds(data.bankIds);
      if (isMobileView) setShowChatOnMobile(false);
    }
  };

  if (isMobileView) {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F0] font-serif">
        {/* Mobile Header with Screen Toggle */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <Bot className="text-[#5A5A40] w-6 h-6" />
            <span className="font-bold text-sm tracking-tight uppercase">CreditGenAI</span>
          </div>
          {!isFormMode && (
            <button 
              onClick={() => setShowChatOnMobile(!showChatOnMobile)}
              className="bg-[#5A5A40] text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              {showChatOnMobile ? (
                <> <LayoutGrid size={12} /> View Offers </>
              ) : (
                <> <MessageSquare size={12} /> View Chat </>
              )}
            </button>
          )}
        </header>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {isFormMode ? (
              <motion.div 
                 key="form-mobile"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="h-full"
              >
                 <ChatFormCollector 
                    initialProfile={profile}
                    isGuest={profile.authMethod === 'guest'}
                    onComplete={onFormComplete!}
                    onLoginRequest={onLoginRequest}
                 />
              </motion.div>
            ) : !showChatOnMobile ? (
              <motion.div 
                key="marketplace"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full"
              >
                <OffersMarketplace 
                  profile={profile}
                  offers={bankOffers}
                  highlightedIds={highlightedBankIds}
                  onAskAI={(text) => {
                    setChatTrigger(text);
                    setShowChatOnMobile(true);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <ChatWindow 
                  profile={profile} 
                  onAIAction={handleAIAction} 
                  isSidebar={false} 
                  messages={chatMessages}
                  setMessages={setChatMessages}
                  externalTrigger={chatTrigger}
                />
              </motion.div>
            )
          }
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#F5F5F0] overflow-hidden relative font-serif">
      {isFormMode ? (
        /* PHASE 2: Full-screen Concierge mode on Desktop */
        <div className="flex-1 h-full flex items-center justify-center p-6 md:p-12 overflow-hidden bg-white/20">
          <div className="w-full max-w-2xl h-full max-h-[900px] bg-white rounded-[60px] shadow-2xl border border-[#5A5A40]/10 overflow-hidden flex flex-col relative">
             <ChatFormCollector 
                initialProfile={profile}
                isGuest={profile.authMethod === 'guest'}
                onComplete={onFormComplete!}
                onLoginRequest={onLoginRequest}
             />
          </div>
        </div>
      ) : (
        <>
          {/* 65% Offers Section (Left) */}
          <div className="w-[65%] h-full overflow-hidden border-r border-[#5A5A40]/10 flex flex-col relative">
            <OffersMarketplace 
              profile={profile}
              offers={bankOffers}
              highlightedIds={highlightedBankIds}
              onAskAI={(text) => setChatTrigger(text)}
            />
          </div>

          {/* 35% Chat Section (Right) */}
          <div className="w-[35%] h-full bg-white flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
               <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-[#5A5A40] rounded-2xl flex items-center justify-center text-white shadow-inner">
                     <Bot className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-serif font-bold text-base leading-tight">AI Assistant</h3>
                     <div className="flex items-center gap-1.5 leading-none mt-0.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#5A5A40]/50">Context Aware</span>
                     </div>
                  </div>
               </div>
               <div className="p-1 px-3 bg-[#5A5A40]/5 rounded-full">
                  <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest">Active Search</span>
               </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ChatWindow 
                profile={profile} 
                onAIAction={handleAIAction} 
                isSidebar={true} 
                messages={chatMessages}
                setMessages={setChatMessages}
                externalTrigger={chatTrigger}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
