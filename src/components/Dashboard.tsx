import React, { useState, useEffect } from 'react';
import { UserProfile, BankOffer } from '../types';
import { apiService } from '../services/apiService';
import { ChatWindow } from './ChatWindow';
import { OffersMarketplace } from './OffersMarketplace';
import { ChatFormCollector } from './ChatFormCollector';
import { MessageSquare, LayoutGrid, ChevronRight, ChevronLeft, Sparkles, X, Bot, FileText, Lock, ShieldCheck } from 'lucide-react';
import { ChatMessage } from '../types';

interface DashboardProps {
  profile: UserProfile;
  isOnboarding?: boolean;
  onFormComplete?: (profile: Partial<UserProfile>) => void;
  onLoginRequest?: () => void;
  onBackToLanding?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, isOnboarding = false, onFormComplete, onLoginRequest, onBackToLanding }) => {
  const [bankOffers, setBankOffers] = useState<BankOffer[]>([]);
  const [highlightedBankIds, setHighlightedBankIds] = useState<string[]>([]);
  const [isMobileView, setIsMobileView] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  ));
  const [showChatOnMobile, setShowChatOnMobile] = useState(isOnboarding || profile.formCompleted === false); 
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
    if (isOnboarding) {
      setShowChatOnMobile(true);
    }
  }, [isOnboarding]);

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
      <div className="flex flex-col h-full bg-[#F2F5FB] font-sans">
        {/* Mobile Header with Screen Toggle - STICKY */}
        <header className="sticky top-0 min-h-16 bg-white border-b border-[#E4EAF4] flex items-center justify-between px-4 pt-safe shrink-0 z-20 shadow-sm">
          <button 
            onClick={onBackToLanding}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <Bot className="text-[#1B6EF3] w-6 h-6" />
            <span className="font-bold text-sm tracking-tight font-display">CreditGenAI</span>
          </button>
          
          <button 
            onClick={() => setShowChatOnMobile(!showChatOnMobile)}
            className="bg-[#1B6EF3] text-white px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-md flex items-center gap-2 transition-all hover:bg-[#0F57D8] active:scale-95 animate-in fade-in zoom-in duration-300"
          >
            {showChatOnMobile ? (
              <> <LayoutGrid size={14} /> View Matches </>
            ) : (
              <> <MessageSquare size={14} /> Back to Chat </>
            )}
          </button>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {!showChatOnMobile ? (
            <div className="h-full">
              <OffersMarketplace 
                profile={profile}
                offers={bankOffers}
                highlightedIds={highlightedBankIds}
                isLocked={isOnboarding}
                onAskAI={(text) => {
                  setChatTrigger(text);
                  setShowChatOnMobile(true);
                }}
              />
            </div>
          ) : (
            <div className="h-full">
              <ChatWindow 
                profile={profile} 
                onAIAction={handleAIAction} 
                isSidebar={false} 
                messages={chatMessages}
                setMessages={setChatMessages}
                externalTrigger={chatTrigger}
                onboardingProps={isOnboarding ? {
                  initialProfile: profile,
                  onComplete: onFormComplete!,
                  onLoginRequest: onLoginRequest,
                  isGuest: profile.authMethod === 'guest'
                } : undefined}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F2F5FB] overflow-hidden relative font-sans">
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* 65% Offers Section (Left Main) - PRIMARY CONTENT */}
          <div className="w-[65%] h-full overflow-y-auto border-r border-[#E4EAF4] flex flex-col relative bg-[#F2F5FB]">
            <div className="px-6 py-4 border-b border-[#E4EAF4] bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white border border-[#E4EAF4] rounded-lg flex items-center justify-center text-[#1B6EF3] shadow-sm">
                     <LayoutGrid size={18} />
                  </div>
                  <div>
                     <h3 className="font-bold text-sm uppercase tracking-wider text-[#0D1626] font-display">Best Matches</h3>
                     <p className="text-[10px] text-[#4A5878] font-medium leading-none mt-0.5">Top financial offers curated for you</p>
                  </div>
               </div>
               {isOnboarding && (
                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                  <Lock size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Onboarding in Progress</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <OffersMarketplace 
                profile={profile}
                offers={bankOffers}
                highlightedIds={highlightedBankIds}
                isLocked={isOnboarding}
                onAskAI={(text) => setChatTrigger(text)}
              />
            </div>
          </div>

          {/* 35% Chat Section (Right Sidebar) - AI ASSISTANT FOCUS */}
          <div className="w-[35%] h-full bg-white flex flex-col shadow-[-4px_0_15px_rgba(13,22,38,0.05)] border-l border-[#E4EAF4] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4EAF4] flex items-center justify-between bg-white shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1B6EF3] rounded-xl flex items-center justify-center text-white shadow-md font-display font-bold">
                     <Bot className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-bold text-base leading-tight text-[#0D1626] font-display">
                        {isOnboarding ? 'AI Assistant' : 'Financial Copilot'}
                     </h3>
                     <div className="flex items-center gap-1.5 leading-none mt-0.5">
                        <div className="w-1.5 h-1.5 bg-[#00A86B] rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4A5878]">Online & Ready</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center">
                 <div className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${isOnboarding ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isOnboarding ? 'text-amber-700' : 'text-[#1253C4]'}`}>
                      {isOnboarding ? 'Phase 1' : 'Active'}
                    </span>
                 </div>
               </div>
            </div>
            
            <div className="flex-1 min-h-0">
              <ChatWindow 
                profile={profile} 
                onAIAction={handleAIAction} 
                isSidebar={true} 
                messages={chatMessages}
                setMessages={setChatMessages}
                externalTrigger={chatTrigger}
                onboardingProps={isOnboarding ? {
                  initialProfile: profile,
                  onComplete: onFormComplete!,
                  onLoginRequest: onLoginRequest,
                  isGuest: profile.authMethod === 'guest'
                } : undefined}
              />
            </div>
          </div>
      </div>
    </div>
  );
};
