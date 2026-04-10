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
          const isSpecificCharge = q.includes('preclosure') || q.includes('pre-closure') || q.includes('foreclosure') || q.includes('repayment') || q.includes('terms') || q.includes('condition');
          
          if (policies.length === 1 && isSpecificCharge) {
            const p = policies[0];
            let directAnswer = "";
            if (q.includes('preclosure') || q.includes('pre-closure')) {
              directAnswer = `The preclosure charges for **${p.bank_name}** are: ${p.preclosure_charges || 'Not specified in our records'}.`;
            } else if (q.includes('foreclosure')) {
              directAnswer = `The foreclosure charges for **${p.bank_name}** are: ${p.foreclosure_charges || 'Not specified in our records'}.`;
            } else if (q.includes('repayment')) {
              directAnswer = `The repayment policy for **${p.bank_name}** is: ${p.repayment_policy || 'Not specified in our records'}.`;
            } else if (q.includes('terms') || q.includes('condition')) {
              directAnswer = `The terms and conditions for **${p.bank_name}** are: ${p.terms_conditions || 'Not specified in our records'}.`;
            }
            
            if (directAnswer) {
              aiResponse.text = directAnswer;
            } else {
              const details = [];
              if (p.repayment_policy) details.push(`**Repayment**: ${p.repayment_policy}`);
              if (p.foreclosure_charges) details.push(`**Foreclosure**: ${p.foreclosure_charges}`);
              if (p.preclosure_charges) details.push(`**Preclosure**: ${p.preclosure_charges}`);
              if (p.terms_conditions) details.push(`**Terms**: ${p.terms_conditions}`);
              aiResponse.text = `Here are the policy details for **${p.bank_name}**:\n\n${details.join('\n')}`;
            }
          } else {
            const policyText = policies.map(p => {
              let details = [];
              if (p.repayment_policy) details.push(`**Repayment**: ${p.repayment_policy}`);
              if (p.foreclosure_charges) details.push(`**Foreclosure**: ${p.foreclosure_charges}`);
              if (p.preclosure_charges) details.push(`**Preclosure**: ${p.preclosure_charges}`);
              if (p.terms_conditions) details.push(`**Terms**: ${p.terms_conditions}`);
              return `### ${p.bank_name} (${p.loan_type})\n${details.join('\n')}`;
            }).join('\n\n---\n\n');
            
            // If Gemini already provided a good intro (like comparing), keep it but append the results cleanly
            if (aiResponse.text && !aiResponse.text.toLowerCase().includes('checking') && !aiResponse.text.toLowerCase().includes('database')) {
              aiResponse.text += `\n\n${policyText}`;
            } else {
              aiResponse.text = policyText;
            }
          }
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
