import { useState, useEffect, useCallback } from 'react';
import { UserProfile, ChatMessage, BankOffer, LoanApplication } from '../types';
import { apiService } from '../services/apiService';
import { getAIResponse } from '../services/geminiService';

const INITIAL_SUGGESTIONS: string[] = [];

export const useChat = (
  profile: UserProfile, 
  bankOffers: BankOffer[], 
  userApplications: LoanApplication[],
  messages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  inputValue?: string
) => {
  const [loading, setLoading] = useState(false);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);
  const [interestedBank, setInterestedBank] = useState<BankOffer | null>(null);
  const [clickedPolicyOptions, setClickedPolicyOptions] = useState<Set<string>>(new Set());
  const [bankInterest, setBankInterest] = useState<Record<string, number>>({});

  const activeApps = userApplications.filter(a => a.status !== 'Approved' && a.status !== 'Rejected');

  // Fetch initial top suggestions
  useEffect(() => {
    const fetchInitialSuggestions = async () => {
      try {
        const results = await apiService.getSuggestions();
        if (results && results.length > 0) {
          setDynamicSuggestions(results.slice(0, 5).map((r: any) => r.label));
        }
      } catch (error) {
        console.error('Failed to fetch initial suggestions:', error);
      }
    };
    fetchInitialSuggestions();
  }, []);

  useEffect(() => {
    if (bankOffers.length === 0) return; // Wait for offers to be available
    
    const fetchChat = async () => {
      try {
        const history = await apiService.getChatHistory(profile.uid);
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setLoading(true);
          try {
            const initialPrompt: ChatMessage = {
              role: 'user',
              content: 'Check my loan eligibility and show me the best offers.',
              timestamp: new Date().toISOString()
            };
            const aiResponse = await getAIResponse([initialPrompt], profile, bankOffers, userApplications);
            const assistantMsg: ChatMessage = {
              role: 'assistant',
              content: aiResponse.text,
              action: aiResponse.action,
              timestamp: new Date().toISOString()
            };
            setMessages([assistantMsg]);
            apiService.saveChatHistory(profile.uid, [assistantMsg]);
            if (aiResponse.suggestions) setDynamicSuggestions(aiResponse.suggestions);
          } catch (err) {
            const welcome: ChatMessage = {
              role: 'assistant',
              content: `Welcome to **CreditGenAI**, ${profile.displayName || 'Friend'}! 👋\n\nI'm ready to help you find the best loan offers. How can I help you today?`,
              timestamp: new Date().toISOString()
            };
            setMessages([welcome]);
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };
    fetchChat();
  }, [profile.uid, profile.displayName, profile.monthlyIncome, bankOffers.length]);

  const saveChat = useCallback(async (newMessages: ChatMessage[]) => {
    await apiService.saveChatHistory(profile.uid, newMessages);
  }, [profile.uid]);

  const handleSend = useCallback(async (text: string, isSuggestion = false) => {
    if (!text.trim() || loading) return;

    if (isSuggestion) {
      apiService.recordSuggestion(text);
      if (interestedBank) {
        if (text.toLowerCase().includes('repayment')) setClickedPolicyOptions(prev => new Set(prev).add(`${interestedBank.id}_repayment`));
        if (text.toLowerCase().includes('preclosure')) setClickedPolicyOptions(prev => new Set(prev).add(`${interestedBank.id}_preclosure`));
        if (text.toLowerCase().includes('terms')) setClickedPolicyOptions(prev => new Set(prev).add(`${interestedBank.id}_terms`));
      }
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const aiResponse = await getAIResponse(updatedMessages, profile, bankOffers, userApplications);
      
      
      if (aiResponse.action?.data?.bankIds?.length === 1) {
        const bankId = aiResponse.action.data.bankIds[0];
        const bank = bankOffers.find(o => o.id === bankId);
        if (bank) {
          setInterestedBank(bank);
          setBankInterest(prev => ({ ...prev, [bankId]: (prev[bankId] || 0) + 1 }));
        }
      }

      bankOffers.forEach(bank => {
        if (text.toLowerCase().includes(bank.bankName.toLowerCase())) {
          setBankInterest(prev => ({ ...prev, [bank.id]: (prev[bank.id] || 0) + 1 }));
        }
      });
      if (aiResponse.action?.type === 'SEARCH_POLICIES') {
        const searchQuery = aiResponse.action.data?.query || text;
        const policies = await apiService.searchPolicies(searchQuery);
        
        if (policies && policies.length > 0) {
          const q = text.toLowerCase();
          const isSpecificCharge = q.includes('preclosure') || q.includes('pre-closure') || q.includes('foreclosure') || q.includes('forecloser') || q.includes('repayment') || q.includes('terms') || q.includes('condition') || q.includes('charge');
          const isCompareQuery = q.includes('compare') || q.includes('versus') || q.includes('vs') || q.includes('difference');
          
          // Filter policies to only those mentioned in the user's query
          let filteredPolicies = policies;
          if (policies.length > 1) {
            // Extract bank names mentioned in the query
            const mentionedBanks = ['ICICI', 'HDFC', 'Axis', 'SBI', 'Kotak', 'Yes', 'IndusInd'];
            const queriedBanks = mentionedBanks.filter(bank => q.includes(bank.toLowerCase()));
            
            if (queriedBanks.length > 0) {
              // Filter to only the banks mentioned in the query
              filteredPolicies = policies.filter(p => 
                queriedBanks.some(bank => p.bank_name.toLowerCase().includes(bank.toLowerCase()))
              );
            }
          }
          
          // Only append if there are multiple banks or it's a comparison query
          if (isCompareQuery && filteredPolicies.length > 1) {
            // Comparison with multiple banks - append all for comparison
            const policyText = filteredPolicies.map(p => {
              let details = [];
              if (p.repayment_policy) details.push(`**Repayment**: ${p.repayment_policy}`);
              if (p.foreclosure_charges) details.push(`**Foreclosure**: ${p.foreclosure_charges}`);
              if (p.preclosure_charges) details.push(`**Preclosure**: ${p.preclosure_charges}`);
              if (p.terms_conditions) details.push(`**Terms**: ${p.terms_conditions}`);
              return `### ${p.bank_name} (${p.loan_type})\n${details.join('\n')}`;
            }).join('\n\n---\n\n');
            
            // Append for comparison
            aiResponse.text += `\n\n${policyText}`;
          }
          // For specific charge queries with single bank: Gemini's response is sufficient, don't append
        } else {
          aiResponse.text = `I searched our database but couldn't find specific policy details for "${searchQuery}". Please check with the bank directly or try a different question.`;
        }
      }
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: aiResponse.text,
        action: aiResponse.action,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      saveChat(finalMessages);
      if (aiResponse.suggestions) setDynamicSuggestions(aiResponse.suggestions);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I encountered an unexpected error. Please try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, profile, bankOffers, userApplications, interestedBank, bankInterest, saveChat]);

  return {
    loading,
    dynamicSuggestions,
    handleSend
  };
};
