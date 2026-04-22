import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Send, IndianRupee, Sparkles, 
  CheckCircle2, Loader2, Bot, LogIn
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';

interface ChatFormCollectorProps {
  initialProfile: Partial<UserProfile>;
  onComplete: (profile: Partial<UserProfile>) => void;
  onLoginRequest?: () => void;
  isGuest?: boolean;
}

interface Question {
  id: string;
  field: keyof UserProfile;
  botMessage: string;
  type: 'chips' | 'quick-number' | 'slider' | 'number' | 'text' | 'composition';
  options?: { label: string; value: any }[];
  condition?: (data: Partial<UserProfile>) => boolean;
  validation?: (value: any) => string | undefined;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  unit?: string;
  valueAs?: 'number' | 'string';
}

function getAgeQuestionConfig(loanType?: string, employmentType?: string) {
  const securedLoan = loanType === 'Home Loan' || loanType === 'Loan Against Property';
  const businessLoan = loanType === 'Business Loan';
  const selfEmployed = employmentType === 'Self-employed';
  const min = securedLoan && selfEmployed ? 23 : 21;
  const max = securedLoan ? 70 : (businessLoan || selfEmployed ? 65 : 60);
  const ages = [21, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70];

  return {
    min,
    max,
    options: ages
      .filter(age => age >= min && age <= max)
      .map(age => ({ label: String(age), value: age }))
  };
}

export const ChatFormCollector: React.FC<ChatFormCollectorProps> = ({ 
  initialProfile, 
  onComplete, 
  onLoginRequest,
  isGuest = true 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<UserProfile>>(initialProfile);
  const [chatHistory, setChatHistory] = useState<{ role: 'bot' | 'user'; content: string | React.ReactNode; field?: string }[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<HTMLDivElement>(null);
  const activeInputRef = useRef<HTMLInputElement>(null);
  const [interactionHeight, setInteractionHeight] = useState(0);
  const [manualEntryEnabled, setManualEntryEnabled] = useState(false);
  const [isMonthEntry, setIsMonthEntry] = useState(false);
  const ageConfig = getAgeQuestionConfig(formData.loanType || initialProfile.loanType, formData.employmentType);

  const QUESTIONS: Question[] = [
    {
      id: 'q1',
      field: 'employmentType',
      botMessage: "Are you salaried or self-employed?",
      type: 'chips',
      options: [
        { label: 'Salaried', value: 'Salaried' },
        { label: 'Self-employed', value: 'Self-employed' }
      ]
    },
    {
      id: 'q2',
      field: 'companyType',
      botMessage: "What type of company do you work for?",
      type: 'chips',
      condition: (d) => d.employmentType === 'Salaried',
      options: [
        { label: 'MNC', value: 'MNC' },
        { label: 'Private Ltd', value: 'Private Ltd' },
        { label: 'Government', value: 'Government/PSU' }
      ]
    },
    {
      id: 'q3',
      field: 'workExperience',
      botMessage: "How many years in current company?",
      type: 'quick-number',
      condition: (d) => d.employmentType === 'Salaried',
      options: [
        { label: 'Less than 1 yr', value: 'months' },
        { label: '1 yr', value: '1' },
        { label: '2 yrs', value: '2' },
        { label: '3 yrs', value: '3' },
        { label: '5 yrs', value: '5' },
        { label: '10 yrs', value: '10' },
        { label: 'Other', value: 'manual' }
      ],
      min: 0,
      max: 40,
      step: 1,
      placeholder: 'Type current company years',
      unit: 'years',
      valueAs: 'string'
    },
    {
      id: 'q4',
      field: 'totalExperience',
      botMessage: "Total years of experience?",
      type: 'quick-number',
      condition: (d) => d.employmentType === 'Salaried',
      options: [
        { label: '1 yr', value: '1' },
        { label: '2 yrs', value: '2' },
        { label: '3 yrs', value: '3' },
        { label: '5 yrs', value: '5' },
        { label: '10 yrs', value: '10' },
        { label: '15 yrs', value: '15' },
        { label: 'Other', value: 'manual' }
      ],
      min: 0,
      max: 45,
      step: 1,
      placeholder: 'Type total experience years',
      unit: 'years',
      valueAs: 'string'
    },
    {
      id: 'q5',
      field: 'monthlyIncome',
      botMessage: "What's your monthly net income?",
      type: 'quick-number',
      options: [
        { label: '₹25K', value: 25000 },
        { label: '₹50K', value: 50000 },
        { label: '₹75K', value: 75000 },
        { label: '₹1L', value: 100000 },
        { label: '₹1.5L', value: 150000 },
        { label: 'Other', value: 'manual' }
      ],
      min: 15000,
      max: 4000000,
      step: 1000,
      placeholder: "Type monthly salary",
      unit: '₹',
      valueAs: 'number'
    },
    {
      id: 'q6',
      field: 'existingEMIs',
      botMessage: "What's your total monthly EMI/liabilities?",
      type: 'quick-number',
      options: [
        { label: 'None', value: 0 },
        { label: '₹5K', value: 5000 },
        { label: '₹10K', value: 10000 },
        { label: '₹20K', value: 20000 },
        { label: '₹40K', value: 40000 },
        { label: 'Other', value: 'manual' }
      ],
      min: 0,
      max: 4000000,
      step: 1000,
      placeholder: "Type existing monthly EMI",
      unit: '₹',
      valueAs: 'number'
    },
    {
      id: 'q7',
      field: 'loanAmountRequired',
      botMessage: "How much loan amount do you need?",
      type: 'quick-number',
      options: [
        { label: '₹5L', value: 500000 },
        { label: '₹10L', value: 1000000 },
        { label: '₹15L', value: 1500000 },
        { label: 'Other', value: 'manual' }
      ],
      min: 100000,
      max: 100000000,
      step: 50000,
      placeholder: "Type loan amount",
      unit: '₹',
      valueAs: 'number'
    },
    {
      id: 'q8',
      field: 'cibilScore',
      botMessage: "What's your estimated CIBIL score?",
      type: 'slider',
      min: 300,
      max: 900,
      step: 1,
      placeholder: "Select or enter your CIBIL score",
      validation: (value) => {
        const num = Number(value);
        if (num < 300 || num > 900) return 'CIBIL score must be between 300 and 900';
        return undefined;
      }
    },
    {
      id: 'q9',
      field: 'age',
      botMessage: "How old are you?",
      type: 'quick-number',
      options: [
        ...ageConfig.options.slice(0, 5),
        { label: 'Other', value: 'manual' }
      ],
      min: ageConfig.min,
      max: ageConfig.max,
      step: 1,
      placeholder: "Type age",
      unit: 'years',
      valueAs: 'number'
    },
    {
      id: 'q10',
      field: 'pincode',
      botMessage: "What's your 6-digit pincode?",
      type: 'number',
      min: 100000,
      max: 999999,
      step: 1,
      placeholder: "Enter 6-digit pincode",
      valueAs: 'string',
      validation: (value) => {
        const str = String(value).trim();
        if (!str) return 'Pincode is required';
        if (str.length !== 6) return 'Pincode must be exactly 6 digits';
        if (!/^[0-9]{6}$/.test(str)) return 'Pincode must contain only digits';
        return undefined;
      }
    }
  ];

  const visibleQuestions = QUESTIONS.filter(q => !q.condition || q.condition(formData));
  const currentQuestion = visibleQuestions[currentIndex] || visibleQuestions[visibleQuestions.length - 1];
  const shouldAutoFocusInput = currentQuestion?.type === 'quick-number' || currentQuestion?.type === 'slider' || currentQuestion?.type === 'number' || currentQuestion?.type === 'text';
  const numericInputMode = currentQuestion?.field === 'cibilScore' || currentQuestion?.field === 'age' || currentQuestion?.field === 'workExperience' || currentQuestion?.field === 'totalExperience' || currentQuestion?.field === 'pincode'
    ? 'numeric'
    : 'decimal';

  // Measure interaction box for dynamic padding
  useEffect(() => {
    if (interactionRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setInteractionHeight(entry.contentRect.height + 48); // Adding some safety margin
        }
      });
      resizeObserver.observe(interactionRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [currentIndex, currentQuestion?.type]);

  useEffect(() => {
    if (!shouldAutoFocusInput || isFinishing) return;

    const focusTimer = window.setTimeout(() => {
      activeInputRef.current?.focus({ preventScroll: true });
    }, 120);

    return () => window.clearTimeout(focusTimer);
  }, [currentIndex, shouldAutoFocusInput, isFinishing]);

  // Restore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chatFormProgress');
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData(prev => ({ ...prev, ...parsed }));
      
      // Re-re-construct history based on saved data
      const history: { role: 'bot' | 'user'; content: string | React.ReactNode; field?: string }[] = [];
      let lastIndex = 0;
      
      const vQs = QUESTIONS.filter(q => !q.condition || q.condition(parsed));
      
      for (let i = 0; i < vQs.length; i++) {
        const q = vQs[i];
        const val = parsed[q.field];
        if (val !== undefined) {
          history.push({ role: 'bot', content: q.botMessage });
          history.push({ role: 'user', content: formatDisplay(q, val), field: q.field as string });
          lastIndex = i + 1;
        } else {
          history.push({ role: 'bot', content: q.botMessage });
          break;
        }
      }
      
      if (lastIndex >= vQs.length) {
        history.push({ role: 'bot', content: "Perfect! Processing your information..." });
        setIsFinishing(true);
        setTimeout(() => {
          onComplete(parsed);
        }, 800);
      }
      
      setChatHistory(history);
      setCurrentIndex(Math.min(lastIndex, vQs.length - 1));
    } else {
      // First message
      setChatHistory([{ role: 'bot', content: `Great! You're interested in ${initialProfile.loanType || 'Personal Loan'}. Let me ask a few quick questions to find the best offers for you.` }, { role: 'bot', content: visibleQuestions[0].botMessage }]);
    }
  }, []);

  // Auto-save
  useEffect(() => {
    localStorage.setItem('chatFormProgress', JSON.stringify(formData));
  }, [formData]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const formatDisplay = (q: Question, val: any) => {
    if (val === null || val === undefined) return '';
    
    if (q.type === 'chips' && q.options) {
      const match = q.options.find(o => o.value === val);
      return match ? match.label : String(val);
    }
    
    if (q.field === 'loanAmountRequired' || q.field === 'monthlyIncome' || q.field === 'existingEMIs') {
      try {
        return new Intl.NumberFormat('en-IN', { 
          style: 'currency', 
          currency: 'INR', 
          maximumFractionDigits: 0 
        }).format(Number(val));
      } catch (e) {
        return String(val);
      }
    }

    if (q.field === 'workExperience' || q.field === 'totalExperience' || q.field === 'age') {
      const numberValue = Number(val);
      if (!Number.isNaN(numberValue)) {
        return `${numberValue} ${numberValue === 1 ? 'year' : 'years'}`;
      }
    }
    
    return String(val);
  };

  const getQuickNumberAnswer = (q: Question, rawValue: number) => {
    const boundedValue = Math.min(Math.max(rawValue, q.min ?? rawValue), q.max ?? rawValue);
    return q.valueAs === 'string' ? String(boundedValue) : boundedValue;
  };

  const handleManualNumberAnswer = () => {
    if (!currentQuestion || !inputValue) return;
    
    // Apply month validation
    if (isMonthEntry) {
      const num = Number(inputValue);
      if (num < 1 || num > 11) {
        alert("Please enter months between 1 and 11");
        return;
      }
    }

    let finalValue: any = inputValue;
    
    if (isMonthEntry) {
      finalValue = `${inputValue} month${Number(inputValue) > 1 ? 's' : ''}`;
    } else {
      // Apply validation if it exists
      if (currentQuestion.validation) {
        const error = currentQuestion.validation(inputValue);
        if (error) {
          alert(error);
          return;
        }
      }
      
      if (currentQuestion.type === 'number' || currentQuestion.type === 'quick-number') {
        const numericValue = Number(inputValue);
        if (Number.isNaN(numericValue)) return;
        finalValue = getQuickNumberAnswer(currentQuestion, numericValue);
      }
    }
    
    handleAnswer(finalValue);
  };

  const handleAnswer = (value: any) => {
    if (value === 'manual') {
      setManualEntryEnabled(true);
      setIsMonthEntry(false);
      return;
    }
    if (value === 'months') {
      setManualEntryEnabled(true);
      setIsMonthEntry(true);
      return;
    }

    const q = currentQuestion;
    const newHistory = [...chatHistory];
    
    // Add user message
    newHistory.push({ 
      role: 'user', 
      content: formatDisplay(q, value),
      field: q.field as string
    });

    const newData = { ...formData, [q.field]: value };
    setFormData(newData);
    setManualEntryEnabled(false);
    setIsMonthEntry(false);
    setInputValue('');

    // Next question
    const nextVQs = QUESTIONS.filter(q => !q.condition || q.condition(newData));
    const nextIdx = nextVQs.findIndex(item => item.id === q.id) + 1;

    if (nextIdx < nextVQs.length) {
      newHistory.push({ role: 'bot', content: nextVQs[nextIdx].botMessage });
      setChatHistory(newHistory);
      setCurrentIndex(nextIdx);
    } else {
      handleFinish(newData, newHistory);
    }
  };

  const handleFinish = (data: Partial<UserProfile> = formData, history = chatHistory) => {
    setIsFinishing(true);
    const newHistory = [...history];
    if (!newHistory.some(h => h.content === "Perfect! Processing your information...")) {
      newHistory.push({ role: 'bot', content: "Perfect! Processing your information..." });
      setChatHistory(newHistory);
    }
    setTimeout(() => {
      onComplete(data);
    }, 1500);
  };

  const handleBack = () => {
    if (currentIndex === 0) return;
    
    // Find previous field in history
    const prevIdx = currentIndex - 1;
    setCurrentIndex(prevIdx);
    
    // Trim history back to before the bot message for current question
    const history = [...chatHistory];
    // Remove last user msg and last bot msg
    history.splice(-2);
    setChatHistory(history);
  };

  const progress = Math.round(((currentIndex + 1) / visibleQuestions.length) * 100);
  const currentNumberValue = Number(formData[currentQuestion.field] ?? currentQuestion.min ?? 0);
  const currentSafeNumberValue = Number.isNaN(currentNumberValue) ? (currentQuestion.min ?? 0) : currentNumberValue;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative font-sans">
      {/* ProgressBar (Subtle) */}
      <div className="h-1 w-full bg-[#E4EAF4] shrink-0">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-[#1B6EF3]"
        />
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar"
        style={{ paddingBottom: interactionHeight }}
      >
        <AnimatePresence mode="popLayout">
          {chatHistory.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 400 }}
              className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse justify-start' : 'justify-start'}`}
            >
              {/* Avatar for bot */}
              {msg.role === 'bot' && (
                <div className="w-8 h-8 rounded-lg bg-[#EBF2FF] border border-[#C8D3E8] flex items-center justify-center shrink-0 shadow-sm text-[#1B6EF3] font-display font-bold">
                  <Bot size={16} />
                </div>
              )}
              
              <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#1B6EF3] text-white rounded-br-none font-medium' 
                  : 'bg-white text-[#0D1626] rounded-bl-none border border-[#E4EAF4]'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isFinishing && (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-[#1B6EF3]" size={24} />
          </div>
        )}
      </div>

      {/* Interaction Center */}
      {!isFinishing && (
        <div 
          ref={interactionRef}
          className="absolute bottom-0 left-0 w-full p-4 md:p-6 pb-[calc(1rem+var(--safe-bottom))] md:pb-[calc(1.5rem+var(--safe-bottom))] bg-gradient-to-t from-[#F2F5FB] via-[#F2F5FB] to-transparent z-30"
        >
          <div className="max-w-md mx-auto">
            <motion.div 
              layout
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-2xl shadow-lg border border-[#E4EAF4] overflow-hidden"
            >
              <div className="p-1">
                  <div className="flex flex-col">
                    {/* Header: Back + Question */}
                    <div className="flex items-start gap-3 p-4 border-b border-[#E4EAF4]">
                      {currentIndex > 0 && (
                        <button 
                          onClick={handleBack}
                          className="w-9 h-9 rounded-lg bg-[#F7F9FD] flex items-center justify-center text-[#4A5878] hover:text-[#1B6EF3] hover:bg-[#EBF2FF] transition-all shrink-0"
                        >
                          <ChevronLeft size={20} />
                        </button>
                      )}
                        <div className="flex-1 pt-0.5">
                          <h3 className="text-base md:text-lg font-semibold text-[#0D1626] leading-tight font-display">
                            {currentQuestion?.botMessage}
                          </h3>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-4 space-y-3">
                      {currentQuestion?.type === 'chips' && (
                        <div className="flex flex-wrap gap-2">
                          {currentQuestion.options?.map(opt => (
                            <motion.button
                              key={opt.value}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleAnswer(opt.value)}
                              className="px-4 py-2.5 bg-white border border-[#E4EAF4] rounded-lg text-sm font-semibold text-[#0D1626] hover:border-[#1B6EF3] hover:text-[#1B6EF3] hover:bg-[#EBF2FF] transition-all shadow-sm"
                            >
                              {opt.label}
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {currentQuestion?.type === 'slider' && (
                        <div className="space-y-4 px-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#8E9BB8]">
                              {currentQuestion.min}
                            </span>
                            <span className="text-2xl font-bold text-[#1B6EF3] font-display">
                              {currentSafeNumberValue}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#8E9BB8]">
                              {currentQuestion.max}
                            </span>
                          </div>
                          <input 
                            type="range"
                            min={currentQuestion.min}
                            max={currentQuestion.max}
                            step={currentQuestion.step}
                            className="slider w-full"
                            value={currentSafeNumberValue}
                            onChange={(e) => {
                              const numericValue = Number(e.target.value);
                              const boundedValue = Math.min(Math.max(numericValue, currentQuestion.min ?? 0), currentQuestion.max ?? numericValue);
                              setFormData(prev => ({ ...prev, [currentQuestion.field]: boundedValue }));
                            }}
                          />
                          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-[#E4EAF4] shadow-sm focus-within:border-[#1B6EF3] transition-colors">
                            <input 
                              ref={activeInputRef}
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              min={currentQuestion.min}
                              max={currentQuestion.max}
                              step={currentQuestion.step || 1}
                              placeholder={currentQuestion.placeholder}
                              className="flex-1 bg-transparent border-none outline-none px-4 py-2.5 font-sans font-medium text-base text-[#0D1626]"
                              value={currentSafeNumberValue}
                              onChange={(e) => {
                                const numericValue = Number(e.target.value);
                                if (Number.isNaN(numericValue)) return;
                                const boundedValue = Math.min(Math.max(numericValue, currentQuestion.min ?? 0), currentQuestion.max ?? numericValue);
                                setFormData(prev => ({ ...prev, [currentQuestion.field]: boundedValue }));
                              }}
                            />
                          </div>
                          <button 
                            onClick={() => handleAnswer(currentSafeNumberValue)}
                            className="w-full bg-[#1B6EF3] text-white py-3 rounded-lg font-semibold shadow-md hover:bg-[#0F57D8] hover:shadow-lg transition-all"
                          >
                            Confirm
                          </button>
                        </div>
                      )}

                      {currentQuestion?.type === 'quick-number' && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {currentQuestion.options?.map(opt => (
                              <motion.button
                                key={opt.label}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleAnswer(opt.value)}
                                className="px-4 py-2.5 bg-white border border-[#E4EAF4] rounded-lg text-sm font-semibold text-[#0D1626] hover:border-[#1B6EF3] hover:text-[#1B6EF3] hover:bg-[#EBF2FF] transition-all shadow-sm"
                              >
                                {opt.label}
                              </motion.button>
                            ))}
                          </div>

                          {manualEntryEnabled && (
                            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-[#1B6EF3] shadow-md animate-in slide-in-from-top-2 duration-200">
                              {currentQuestion.unit === '₹' && !isMonthEntry && (
                                <div className="w-10 h-10 rounded-lg bg-[#EBF2FF] text-[#1B6EF3] flex items-center justify-center font-bold shrink-0">
                                  ₹
                                </div>
                              )}
                              <input 
                                ref={activeInputRef}
                                type="number"
                                inputMode={numericInputMode}
                                pattern="[0-9]*"
                                min={isMonthEntry ? 1 : currentQuestion.min}
                                max={isMonthEntry ? 11 : currentQuestion.max}
                                step={currentQuestion.step || 1}
                                placeholder={isMonthEntry ? "Enter months (1-11)" : currentQuestion.placeholder}
                                className="flex-1 bg-transparent border-none outline-none px-3 py-2.5 font-sans font-medium text-base text-[#0D1626] min-w-0"
                                value={inputValue}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (isMonthEntry && val.length > 2) return;
                                  setInputValue(val);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && inputValue && handleManualNumberAnswer()}
                                autoFocus
                              />
                              {isMonthEntry ? (
                                <span className="text-xs font-semibold uppercase tracking-wide text-[#8E9BB8] pr-2">
                                  Months
                                </span>
                              ) : (
                                currentQuestion.unit && currentQuestion.unit !== '₹' && (
                                  <span className="text-xs font-semibold uppercase tracking-wide text-[#8E9BB8] pr-1">
                                    {currentQuestion.unit}
                                  </span>
                                )
                              )}
                              <button 
                                disabled={!inputValue}
                                onClick={handleManualNumberAnswer}
                                className="w-10 h-10 bg-[#1B6EF3] text-white rounded-lg flex items-center justify-center hover:bg-[#0F57D8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                              >
                                <Send size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {(currentQuestion?.type === 'number' || currentQuestion?.type === 'text') && (
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-[#E4EAF4] shadow-sm focus-within:border-[#1B6EF3] transition-colors">
                          <input 
                            ref={activeInputRef}
                            type={currentQuestion.type === 'number' ? 'number' : 'text'}
                            inputMode={currentQuestion.type === 'number' ? numericInputMode : 'text'}
                            pattern={currentQuestion.type === 'number' ? '[0-9]*' : undefined}
                            placeholder={currentQuestion.placeholder}
                            min={currentQuestion.type === 'number' ? currentQuestion.min : undefined}
                            max={currentQuestion.type === 'number' ? currentQuestion.max : undefined}
                            className="flex-1 bg-transparent border-none outline-none px-4 py-2.5 font-sans font-medium text-base text-[#0D1626]"
                            value={inputValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              // For pincode, only allow up to 6 digits
                              if (currentQuestion.field === 'pincode' && val.length > 6) {
                                return;
                              }
                              setInputValue(val);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && inputValue && handleManualNumberAnswer()}
                            autoFocus
                          />
                          <button 
                            disabled={!inputValue}
                            onClick={handleManualNumberAnswer}
                            className="w-10 h-10 bg-[#1B6EF3] text-white rounded-lg flex items-center justify-center hover:bg-[#0F57D8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};
