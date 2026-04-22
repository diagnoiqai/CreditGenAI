import React, { useRef, useEffect, useState } from 'react';
import { UserProfile, BankOffer, ChatMessage } from '../types';
import { useChat } from '../hooks/useChat';
import { useApplications } from '../hooks/useApplications';
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';
import { SuggestionChips } from './chat/SuggestionChips';
import { ApplicationModals } from './chat/ApplicationModals';
import { ChatFormCollector } from './ChatFormCollector';
import { apiService } from '../services/apiService';

interface ChatWindowProps {
  profile: UserProfile;
  onAIAction?: (data: any) => void;
  isSidebar?: boolean;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  externalTrigger?: string | null;
  onboardingProps?: {
    initialProfile: Partial<UserProfile>;
    onComplete: (profile: Partial<UserProfile>) => void;
    onLoginRequest?: () => void;
    isGuest?: boolean;
  };
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  profile, 
  onAIAction, 
  isSidebar = false,
  messages,
  setMessages,
  externalTrigger,
  onboardingProps
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bankOffers, setBankOffers] = useState<BankOffer[]>([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const fetchOffers = async () => {
      const dbOffers = await apiService.getBankOffers();
      if (dbOffers && dbOffers.length > 0) {
        setBankOffers(dbOffers);
      }
    };
    fetchOffers();
  }, []);
  
  const {
    userApplications,
    showMobilePrompt,
    setShowMobilePrompt,
    mobileInput,
    setMobileInput,
    applyingFor,
    submittingApplication,
    handleApply,
    submitApplication,
    applicationMessage,
    setApplicationMessage
  } = useApplications(profile, (msg) => setMessages(prev => [...prev, msg]));

  const { 
    loading, 
    dynamicSuggestions, 
    handleSend
  } = useChat(profile, bankOffers, userApplications, messages, setMessages, inputValue, onAIAction);

  // Handle external triggers (e.g. from Bank Cards)
  useEffect(() => {
    if (externalTrigger && !loading) {
      handleSend(externalTrigger);
    }
  }, [externalTrigger, loading]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (onboardingProps) {
    return (
      <ChatFormCollector 
        {...onboardingProps}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Messages */}
      <div className={`flex-1 min-h-0 w-full flex flex-col ${isSidebar ? 'px-4' : 'max-w-[1400px] mx-auto px-[10%]'}`}>
        <MessageList 
          messages={messages}
          loading={loading}
          profile={profile}
          bankOffers={bankOffers}
          userApplications={userApplications}
          onApply={handleApply}
          onAskAI={(text) => handleSend(text)}
          scrollRef={scrollRef}
        />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-50 relative z-10 w-full shrink-0">
        <div className={`w-full mx-auto py-3 md:py-4 ${isSidebar ? 'px-4 pb-4' : 'max-w-[1400px] px-[10%]'}`}>
          <SuggestionChips 
            suggestions={dynamicSuggestions}
            onSelect={handleSend}
          />
          <ChatInput 
            onSend={(text) => handleSend(text)}
            loading={loading}
            onChange={setInputValue}
          />
        </div>
      </div>

      {/* Modals */}
      <ApplicationModals 
        showMobilePrompt={showMobilePrompt}
        setShowMobilePrompt={setShowMobilePrompt}
        mobileInput={mobileInput}
        setMobileInput={setMobileInput}
        applyingFor={applyingFor}
        submittingApplication={submittingApplication}
        onSubmitApplication={submitApplication}
        applicationMessage={applicationMessage}
        setApplicationMessage={setApplicationMessage}
      />
    </div>
  );
};
