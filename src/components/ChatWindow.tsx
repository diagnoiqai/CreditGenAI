import React, { useRef, useEffect, useState } from 'react';
import { UserProfile, BankOffer, ChatMessage } from '../types';
import { useChat } from '../hooks/useChat';
import { useApplications } from '../hooks/useApplications';
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';
import { SuggestionChips } from './chat/SuggestionChips';
import { ApplicationModals } from './chat/ApplicationModals';
import { apiService } from '../services/apiService';

interface ChatWindowProps {
  profile: UserProfile;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ profile }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
  } = useChat(profile, bankOffers, userApplications, messages, setMessages, inputValue);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5A5A40] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5A5A40]/20">
            <span className="text-white font-serif font-bold text-xl">C</span>
          </div>
          <div>
            <h2 className="font-serif font-bold text-[#5A5A40] text-lg leading-tight">CreditGenAI</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-sans uppercase tracking-widest text-gray-400 font-bold">AI Assistant Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 w-full max-w-[1400px] mx-auto px-[10%] flex flex-col">
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
        <div className="max-w-[1400px] mx-auto px-[10%] py-6 md:py-8">
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
