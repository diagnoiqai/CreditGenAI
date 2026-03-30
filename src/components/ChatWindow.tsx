import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, BankOffer, LoanApplication } from '../types';
import { getAIResponse, clearAICache } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Plus, User, Bot, Sparkles, ChevronRight, Calculator, Search, Percent, AlertCircle, FileText, TrendingUp, CheckCircle2, IndianRupee } from 'lucide-react';
import Markdown from 'react-markdown';

interface ChatWindowProps {
  profile: UserProfile;
}

const INITIAL_SUGGESTIONS = [
  'Check my loan eligibility',
  'Find best loan offers for me',
  'Calculate EMI for my loan',
  'What are the HDFC repayment policy?',
  'Compare interest rates',
  'Which bank approves fastest?'
];

export const ChatWindow: React.FC<ChatWindowProps> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bankOffers, setBankOffers] = useState<BankOffer[]>([]);
  const [userApplications, setUserApplications] = useState<LoanApplication[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);
  const [interestedBank, setInterestedBank] = useState<BankOffer | null>(null);
  const [clickedPolicyOptions, setClickedPolicyOptions] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const [applyingFor, setApplyingFor] = useState<BankOffer | null>(null);
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [mobileInput, setMobileInput] = useState(profile.mobile || '');
  const [applicationMessage, setApplicationMessage] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({});
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [bankInterest, setBankInterest] = useState<Record<string, number>>({});

  useEffect(() => {
    // Clear AI cache when profile changes to ensure fresh responses
    clearAICache();
  }, [profile]);

  useEffect(() => {
    const fetchOffers = async () => {
      const dbOffers = await apiService.getBankOffers();
      if (dbOffers && dbOffers.length > 0) {
        setBankOffers(dbOffers);
      } else {
        // Fallback to mock if DB is empty
        const mockOffers: BankOffer[] = [
        {
          id: 'hdfc-pl',
          bankName: 'HDFC Bank',
          loanType: 'Personal Loan',
          minAmount: 50000,
          maxAmount: 5000000,
          minInterestRate: 10.5,
          maxInterestRate: 21.0,
          processingFee: 2.5,
          minTenure: 12,
          maxTenure: 60,
          minCibilScore: 750,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'icici-pl',
          bankName: 'ICICI Bank',
          loanType: 'Personal Loan',
          minAmount: 50000,
          maxAmount: 5000000,
          minInterestRate: 10.75,
          maxInterestRate: 19.0,
          processingFee: 2.0,
          minTenure: 12,
          maxTenure: 72,
          minCibilScore: 720,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'fullerton-pl',
          bankName: 'Fullerton India',
          loanType: 'Personal Loan',
          minAmount: 50000,
          maxAmount: 2500000,
          minInterestRate: 11.99,
          maxInterestRate: 23.99,
          processingFee: 3.0,
          minTenure: 12,
          maxTenure: 60,
          minCibilScore: 600,
          interestRateBelow750: 14.5,
          maxAmountPercentBelow750: 80,
          lastUpdated: new Date().toISOString()
        }
      ];
      setBankOffers(mockOffers);
      }
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      const apps = await apiService.getApplications(profile.uid);
      setUserApplications(apps);
    };
    fetchApplications();
  }, [profile.uid]);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const history = await apiService.getChatHistory(profile.uid);
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          const welcome: ChatMessage = {
            role: 'assistant',
            content: `Welcome to **CreditGenAI**, ${profile.displayName || 'Friend'}! 👋\n\nI've analyzed your profile. Based on your income of **₹${profile.monthlyIncome?.toLocaleString('en-IN')}**, I can help you find the best loan offers from our database.\n\nHow can I help you today? You can select an option below or ask me anything!`,
            timestamp: new Date().toISOString()
          };
          setMessages([welcome]);
          apiService.saveChatHistory(profile.uid, [welcome]);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };
    fetchChat();
  }, [profile.uid, profile.displayName, profile.monthlyIncome]);

  useEffect(() => {
    // Timed suggestions for interested bank
    if (!interestedBank) return;

    const timer = setInterval(() => {
      const options = [
        { label: `Repayment policy of ${interestedBank.bankName}`, id: 'repayment' },
        { label: `Preclosure charges of ${interestedBank.bankName}`, id: 'preclosure' },
        { label: `Terms and conditions of ${interestedBank.bankName}`, id: 'terms' }
      ];

      const available = options.filter(o => !clickedPolicyOptions.has(`${interestedBank.id}_${o.id}`));
      if (available.length > 0) {
        setDynamicSuggestions(prev => {
          const newSug = available[0].label;
          if (prev.includes(newSug)) return prev;
          return [...prev, newSug].slice(-4);
        });
      }
    }, 45000); // Every 45 seconds

    return () => clearInterval(timer);
  }, [interestedBank, clickedPolicyOptions]);

  const handleApply = (offer: BankOffer) => {
    setApplyingFor(offer);
    if (!profile.mobile) {
      setShowMobilePrompt(true);
    } else {
      submitApplication(profile.mobile);
    }
  };

  const submitApplication = async (mobile: string) => {
    if (!mobile || mobile.length < 10 || !applyingFor || submittingApplication) return;
    setSubmittingApplication(true);
    try {
      const updatedProfile = { ...profile, mobile };
      if (!profile.mobile) {
        await apiService.saveUserProfile(updatedProfile);
      }

      // Call the server-side API to send the email to the bank and save to DB
      const result = await apiService.applyForLoan(updatedProfile, applyingFor);
      
      if (result.success) {
        setApplicationMessage(result.message);
        // Refresh applications
        const apps = await apiService.getApplications(profile.uid);
        setUserApplications(apps);
      } else {
        setApplicationMessage("Application received! One of our executive will get back to you for further process.");
      }
      
      setShowMobilePrompt(false);
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setSubmittingApplication(false);
    }
  };

  const saveChat = async (newMessages: ChatMessage[]) => {
    await apiService.saveChatHistory(profile.uid, newMessages);
  };

  const handleSend = async (text: string, isSuggestion = false) => {
    if (!text.trim() || loading) return;

    if (isSuggestion) {
      apiService.recordSuggestion(text);
      // If it's a policy suggestion, mark it as clicked
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
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await getAIResponse(updatedMessages, profile, bankOffers);
      
      // Update interested bank if AI mentions one
      if (aiResponse.action?.data?.bankIds?.length === 1) {
        const bankId = aiResponse.action.data.bankIds[0];
        const bank = bankOffers.find(o => o.id === bankId);
        if (bank) {
          setInterestedBank(bank);
          setBankInterest(prev => ({ ...prev, [bankId]: (prev[bankId] || 0) + 1 }));
        }
      }

      // Also check user text for bank mentions to track interest
      bankOffers.forEach(bank => {
        if (text.toLowerCase().includes(bank.bankName.toLowerCase())) {
          setBankInterest(prev => ({ ...prev, [bank.id]: (prev[bank.id] || 0) + 1 }));
        }
      });

      // Handle policy search
      if (aiResponse.action?.type === 'SEARCH_POLICIES') {
        const policies = await apiService.searchPolicies(text);
        if (policies && policies.length > 0) {
          const policyText = policies.map(p => `**${p.bank_name}**: ${p.repayment_policy || p.preclosure_charges || p.terms_conditions}`).join('\n\n');
          aiResponse.text += `\n\nHere is what I found in the policies:\n\n${policyText}`;
        }
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: aiResponse.text,
        action: aiResponse.action,
        timestamp: new Date().toISOString()
      };

      if (aiResponse.suggestions) {
        let filteredSuggestions = aiResponse.suggestions;
        
        // Filter out policy suggestions unless interest is high enough
        const isPolicySuggestion = (s: string) => 
          s.toLowerCase().includes('repayment') || 
          s.toLowerCase().includes('preclosure') || 
          s.toLowerCase().includes('terms');

        if (interestedBank && (bankInterest[interestedBank.id] || 0) < 2) {
          filteredSuggestions = filteredSuggestions.filter(s => !isPolicySuggestion(s));
        }

        setDynamicSuggestions(filteredSuggestions);
      }

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
  };

  const calculateEMI = (p: number, r: number, n: number) => {
    const monthlyRate = r / 12 / 100;
    const emi = (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    return Math.round(emi);
  };

  const calculateMaxLoan = (monthlyIncome: number, existingEMIs: number, rate: number, tenure: number, bankMax: number) => {
    const foir = 0.5; // 50% FOIR
    const availableEMI = (monthlyIncome * foir) - existingEMIs;
    if (availableEMI <= 0) return 0;

    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) return bankMax;

    // PV = EMI * [(1 - (1 + r)^-n) / r]
    const maxLoan = availableEMI * ((1 - Math.pow(1 + monthlyRate, -tenure)) / monthlyRate);
    return Math.min(Math.round(maxLoan), bankMax);
  };

  const renderAction = (action: ChatMessage['action'], messageIndex: number) => {
    if (!action || action.data?.hideCard) return null;

    const matchedOffers = Array.from(new Set(action.data.bankIds || []))
      .map((id: any) => bankOffers.find(o => o.id === id))
      .filter(Boolean) as BankOffer[];

    const isExpanded = expandedMessages[messageIndex];

    switch (action.type) {
      case 'COMPARE_OFFERS':
      case 'ELIGIBILITY_SUMMARY':
        const bestMatch = matchedOffers[0];
        const moreOptions = matchedOffers.slice(1, 11);

        const renderOffersTable = (offers: BankOffer[]) => {
          return (
            <div className="bg-white rounded-3xl border border-[#5A5A40]/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[#F5F5F0] text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold">
                      <th className="p-4">Bank Name</th>
                      <th className="p-4">Eligible Loan</th>
                      <th className="p-4">Tenure</th>
                      <th className="p-4">Interest Rate</th>
                      <th className="p-4">EMI</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {offers.map((offer, idx) => {
                      const currentCibil = action.data.requestedCibil || profile.cibilScore || 0;
                      const isLowCibil = currentCibil > 0 && currentCibil < 750;
                      const interestRate = (isLowCibil && offer.interestRateBelow750) ? offer.interestRateBelow750 : offer.minInterestRate;
                      const maxAmountLimit = (isLowCibil && offer.maxAmountPercentBelow750) ? (offer.maxAmount * offer.maxAmountPercentBelow750 / 100) : offer.maxAmount;

                      const currentSalary = action.data.requestedSalary || profile.monthlyIncome || 0;
                      const maxLoan = calculateMaxLoan(
                        currentSalary,
                        profile.existingEMIs || 0,
                        interestRate,
                        offer.maxTenure,
                        maxAmountLimit
                      );
                      
                      const showMax = action.data.showMax || false;
                      const requestedAmount = showMax ? 0 : (action.data.requestedAmount || profile.loanAmountRequired || 0);
                      const displayAmount = (requestedAmount > 0 && requestedAmount <= maxLoan) ? requestedAmount : maxLoan;
                      
                      const actualEMI = calculateEMI(displayAmount, interestRate, offer.maxTenure);
                      const hasApplied = userApplications.some(app => String(app.bankId) === String(offer.id));

                      return (
                        <tr key={`${offer.id}-${idx}`} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-serif font-bold text-[#5A5A40]">{offer.bankName}</p>
                            <p className="text-[8px] text-gray-400 uppercase tracking-tighter">
                              {isLowCibil ? 'CIBIL < 750' : 'Standard'}
                            </p>
                          </td>
                          <td className="p-4 font-serif font-bold text-[#5A5A40]">
                            ₹{(displayAmount / 100000).toFixed(2)}L
                          </td>
                          <td className="p-4 text-gray-600 font-bold">
                            {offer.maxTenure} Mo
                          </td>
                          <td className="p-4">
                            <span className="text-xs bg-[#F5F5F0] px-2 py-1 rounded-full font-bold text-[#5A5A40]">
                              {interestRate}%
                            </span>
                          </td>
                          <td className="p-4 font-serif font-bold text-[#1a1a1a]">
                            ₹{actualEMI.toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => !hasApplied && handleApply(offer)}
                              disabled={hasApplied}
                              className={`px-4 py-1.5 text-[10px] font-sans uppercase tracking-widest rounded-full transition-all shadow-sm active:scale-95 ${
                                hasApplied 
                                  ? 'bg-green-100 text-green-700 cursor-default border border-green-200' 
                                  : 'bg-[#5A5A40] text-white hover:bg-[#4A4A30]'
                              }`}
                            >
                              {hasApplied ? 'Applied' : 'Apply'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        };

        return (
          <div className="mt-4 space-y-4">
            <p className="text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold">
              {matchedOffers.length > 1 ? 'Comparison of Eligible Banks' : 'Recommended for you'}
            </p>
            {renderOffersTable(matchedOffers)}
          </div>
        );

      case 'CALCULATE_EMI':
        const amount = action.data.requestedAmount || action.data.amount || profile.loanAmountRequired || 500000;
        const tenure = (action.data.requestedTenure ? action.data.requestedTenure * 12 : (action.data.tenure || 48));
        
        return (
          <div className="mt-4 space-y-4">
            <p className="text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold mb-2">EMI Estimates (₹{amount.toLocaleString('en-IN')} for {tenure} Mo)</p>
            <div className="bg-white rounded-3xl border border-[#5A5A40]/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[#F5F5F0] text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold">
                      <th className="p-4">Bank Name</th>
                      <th className="p-4">Monthly EMI</th>
                      <th className="p-4">Interest</th>
                      <th className="p-4">Total Interest</th>
                      <th className="p-4">Fee</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {matchedOffers.map((offer, idx) => {
                      const emi = calculateEMI(amount, offer.minInterestRate, tenure);
                      const totalRepayment = emi * tenure;
                      const totalInterest = totalRepayment - amount;
                      const hasApplied = userApplications.some(app => String(app.bankId) === String(offer.id));

                      return (
                        <tr key={`${offer.id}-${idx}`} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-serif font-bold text-[#5A5A40]">{offer.bankName}</p>
                          </td>
                          <td className="p-4 font-serif font-bold text-[#1a1a1a]">
                            ₹{emi.toLocaleString('en-IN')}
                          </td>
                          <td className="p-4">
                            <span className="text-xs bg-[#F5F5F0] px-2 py-1 rounded-full font-bold text-[#5A5A40]">
                              {offer.minInterestRate}%
                            </span>
                          </td>
                          <td className="p-4 text-gray-600">
                            ₹{totalInterest.toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 text-gray-400 text-xs">
                            {offer.processingFee}%
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => !hasApplied && handleApply(offer)}
                              disabled={hasApplied}
                              className={`px-4 py-1.5 text-[10px] font-sans uppercase tracking-widest rounded-full transition-all shadow-sm active:scale-95 ${
                                hasApplied 
                                  ? 'bg-green-100 text-green-700 cursor-default border border-green-200' 
                                  : 'bg-[#5A5A40] text-white hover:bg-[#4A4A30]'
                              }`}
                            >
                              {hasApplied ? 'Applied' : 'Apply'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto bg-white rounded-[40px] shadow-2xl overflow-hidden border border-[#5A5A40]/10 m-4">
      {/* Header */}
      <div className="bg-[#5A5A40] p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl">CreditGenAI Advisor</h2>
            <p className="text-xs text-white/70 font-sans uppercase tracking-widest">Powered by Gemini AI</p>
          </div>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-sm font-serif italic">Expert Loan Guidance</p>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F5F5F0]/30"
      >
        {messages.map((m, i) => (
          <motion.div
            key={`chat-msg-${m.role}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-[#5A5A40] text-white' : 'bg-white border border-[#5A5A40]/20 text-[#5A5A40]'}`}>
                {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`p-4 rounded-3xl shadow-sm ${m.role === 'user' ? 'bg-[#5A5A40] text-white rounded-tr-none' : 'bg-white text-[#1a1a1a] rounded-tl-none border border-gray-100'}`}>
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-serif">
                  <Markdown>{m.content}</Markdown>
                </div>
                {m.action && renderAction(m.action, i)}
                <span className={`text-[10px] mt-2 block opacity-50 ${m.role === 'user' ? 'text-right' : ''}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-gray-100 flex gap-2 items-center">
              <div className="w-2 h-2 bg-[#5A5A40] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#5A5A40] rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-[#5A5A40] rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="p-6 bg-white border-t border-[#5A5A40]/5">
        {/* Dynamic Suggestions */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {dynamicSuggestions.slice(0, 6).map((sug, i) => (
            <button
              key={`suggestion-${i}`}
              onClick={() => handleSend(sug, true)}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-[#F5F5F0] text-[#5A5A40] text-sm font-serif border border-[#5A5A40]/10 hover:bg-[#5A5A40] hover:text-white transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <Sparkles className="w-3 h-3" /> {sug}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-[#F5F5F0] p-2 rounded-full border border-[#5A5A40]/10">
          <button className="p-3 rounded-full hover:bg-white transition-all text-[#5A5A40]">
            <Plus className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            placeholder="Ask CreditGenAI anything about loans..."
            className="flex-1 bg-transparent outline-none font-serif text-lg px-2"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="p-3 rounded-full bg-[#5A5A40] text-white hover:bg-[#4A4A30] transition-all disabled:opacity-50 shadow-md"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Application Modals */}
      <AnimatePresence>
        {showMobilePrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#F5F5F0] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#5A5A40]/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#5A5A40]/10 rounded-full flex items-center justify-center">
                  <Sparkles className="text-[#5A5A40] w-6 h-6" />
                </div>
                <h3 className="text-2xl font-serif font-bold">Almost there!</h3>
              </div>
              <p className="text-[#5A5A40] font-serif italic mb-6">
                To process your application with **{applyingFor?.bankName}**, we need your mobile number to get in touch.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold mb-1 ml-1">Mobile Number</label>
                  <input 
                    type="tel"
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full bg-white border border-[#5A5A40]/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowMobilePrompt(false)}
                    className="flex-1 px-4 py-3 border border-[#5A5A40]/20 rounded-2xl text-sm font-sans uppercase tracking-widest text-[#5A5A40] hover:bg-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => submitApplication(mobileInput)}
                    disabled={mobileInput.length < 10 || submittingApplication}
                    className="flex-1 px-4 py-3 bg-[#5A5A40] text-white rounded-2xl text-sm font-sans uppercase tracking-widest hover:bg-[#4A4A30] disabled:opacity-50 transition-all shadow-lg flex items-center justify-center"
                  >
                    {submittingApplication ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Submit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {applicationMessage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#F5F5F0] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#5A5A40]/20 text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-4">Application Received!</h3>
              <p className="text-[#5A5A40] font-serif italic mb-8">
                {applicationMessage}
              </p>
              <button 
                onClick={() => setApplicationMessage(null)}
                className="w-full px-4 py-3 bg-[#5A5A40] text-white rounded-2xl text-sm font-sans uppercase tracking-widest hover:bg-[#4A4A30] transition-all shadow-lg"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
