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
  type: 'chips' | 'slider' | 'number' | 'text' | 'composition';
  options?: { label: string; value: any }[];
  condition?: (data: Partial<UserProfile>) => boolean;
  validation?: (value: any) => string | undefined;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
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
  const [showSignInPitch, setShowSignInPitch] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const QUESTIONS: Question[] = [
    {
      id: 'q1',
      field: 'employmentType',
      botMessage: "👔 Are you salaried or self-employed?",
      type: 'chips',
      options: [
        { label: 'Salaried', value: 'Salaried' },
        { label: 'Self-employed', value: 'Self-employed' }
      ]
    },
    {
      id: 'q2',
      field: 'companyType',
      botMessage: "🏢 What type of company do you work for?",
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
      botMessage: "⏱️ How many years in current company?",
      type: 'chips',
      condition: (d) => d.employmentType === 'Salaried',
      options: [
        { label: '0-2 years', value: '0-2' },
        { label: '2-5 years', value: '2-5' },
        { label: '5-10 years', value: '5-10' },
        { label: '10+ years', value: '10+' }
      ]
    },
    {
      id: 'q4',
      field: 'totalExperience',
      botMessage: "📊 Total years of experience?",
      type: 'chips',
      condition: (d) => d.employmentType === 'Salaried',
      options: [
        { label: '0-2 years', value: '0-2' },
        { label: '2-5 years', value: '2-5' },
        { label: '5-10 years', value: '5-10' },
        { label: '10-15 years', value: '10-15' },
        { label: '15+ years', value: '15+' }
      ]
    },
    {
      id: 'q5',
      field: 'monthlyIncome',
      botMessage: "💰 What's your monthly net salary?",
      type: 'chips',
      condition: (d) => d.employmentType === 'Salaried',
      options: [
        { label: '₹20-30K', value: 25000 },
        { label: '₹30-50K', value: 40000 },
        { label: '₹50-75K', value: 62500 },
        { label: '₹75-100K', value: 87500 },
        { label: '₹100K+', value: 120000 }
      ]
    },
    {
      id: 'q6',
      field: 'existingEMIs',
      botMessage: "📋 What's your total monthly EMI/liabilities?",
      type: 'chips',
      condition: (d) => d.employmentType === 'Salaried',
      options: [
        { label: 'None', value: 0 },
        { label: '₹0-5K', value: 2500 },
        { label: '₹5-10K', value: 7500 },
        { label: '₹10-20K', value: 15000 },
        { label: '₹20K+', value: 30000 }
      ]
    },
    {
      id: 'q7',
      field: 'loanAmountRequired',
      botMessage: "🎯 How much loan amount do you need?",
      type: 'slider',
      min: 100000,
      max: 5000000,
      step: 50000
    },
    {
      id: 'q8',
      field: 'cibilScore',
      botMessage: "📊 What's your estimated CIBIL score?",
      type: 'slider',
      min: 300,
      max: 900,
      step: 1,
      placeholder: "Select or enter your CIBIL score"
    },
    {
      id: 'q9',
      field: 'age',
      botMessage: "🍰 How old are you?",
      type: 'number',
      min: 18,
      max: 65,
      placeholder: "e.g. 28"
    },
    {
      id: 'q10',
      field: 'city', // Composition but simpler for now
      botMessage: "📍 What's your city and 6-digit pincode?",
      type: 'text',
      placeholder: "City, Pincode (e.g. Mumbai, 400001)"
    }
  ];

  const visibleQuestions = QUESTIONS.filter(q => !q.condition || q.condition(formData));
  const currentQuestion = visibleQuestions[currentIndex] || visibleQuestions[visibleQuestions.length - 1];

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
        // Form was potentially complete
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
    
    if (q.field === 'loanAmountRequired' || q.field === 'monthlyIncome') {
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
    
    return String(val);
  };

  const handleAnswer = (value: any) => {
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

    // Next question
    const nextVQs = QUESTIONS.filter(q => !q.condition || q.condition(newData));
    const nextIdx = nextVQs.findIndex(item => item.id === q.id) + 1;

    if (nextIdx < nextVQs.length) {
      // PHASE 3: Trigger Sign-in Pitch after Salary (monthlyIncome)
      if (isGuest && q.field === 'monthlyIncome' && !showSignInPitch) {
        setShowSignInPitch(true);
        newHistory.push({ 
          role: 'bot', 
          content: "Great! Based on your income, I can see **12+ potential bank offers** ready for you. 🚀 You can save your progress anytime by logging in using the button above."
        });
      }

      newHistory.push({ role: 'bot', content: nextVQs[nextIdx].botMessage });
      setChatHistory(newHistory);
      setCurrentIndex(nextIdx);
    } else {
      // Form Complete
      setIsFinishing(true);
      newHistory.push({ role: 'bot', content: "✨ Perfect! Processing your information..." });
      setChatHistory(newHistory);
      setTimeout(() => {
        onComplete(newData);
      }, 1500);
    }
    setInputValue('');
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

  return (
    <div className="flex flex-col h-full bg-[#F5F5F0] overflow-hidden relative font-serif">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#5A5A40] rounded-lg flex items-center justify-center text-white shadow-inner">
            <Bot size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight text-gray-900">Application Flow</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">
                {currentIndex + 1} / {visibleQuestions.length}
              </span>
              <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-[#5A5A40]"
                />
              </div>
            </div>
          </div>
        </div>

        {isGuest && onLoginRequest && (
          <button 
            onClick={onLoginRequest}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] border border-[#5A5A40]/20 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            <LogIn size={14} /> Log In
          </button>
        )}
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth pb-32"
      >
        <AnimatePresence mode="popLayout">
          {chatHistory.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 400 }}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse pb-2 pl-12' : 'flex-row pb-2 pr-12'}`}
            >
              {/* Avatar for bot */}
              {msg.role === 'bot' && (
                <div className="w-8 h-8 rounded-xl bg-white border border-[#5A5A40]/10 flex items-center justify-center shrink-0 shadow-sm text-[#5A5A40]">
                  <Bot size={18} />
                </div>
              )}
              
              <div className={`px-5 py-3.5 rounded-[24px] md:rounded-[32px] text-sm md:text-base leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#5A5A40] text-white rounded-tr-none font-sans shadow-md' 
                  : 'bg-white text-[#2d2d2d] rounded-tl-none border border-white'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isFinishing && (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-[#5A5A40]" size={24} />
          </div>
        )}
      </div>

      {/* Input / UI Area */}
      {!isFinishing && (
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-[#F5F5F0] via-[#F5F5F0] to-transparent z-10">
          <div className="max-w-xl mx-auto space-y-4">
            
            {/* Chips Renderer */}
            {currentQuestion?.type === 'chips' && currentQuestion.options && (
              <div className="flex flex-wrap gap-2 justify-center">
                {currentQuestion.options.map(opt => (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(opt.value)}
                    className="px-6 py-2.5 bg-white border border-[#5A5A40]/10 rounded-full text-sm font-bold text-[#5A5A40] hover:bg-[#5A5A40] hover:text-white transition-all shadow-sm"
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Slider Renderer */}
            {currentQuestion?.type === 'slider' && (
              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl space-y-6">
                <div className="text-center">
                  <span className="text-3xl font-bold text-[#5A5A40]">
                    {formatDisplay(currentQuestion, formData[currentQuestion.field] || currentQuestion.min)}
                  </span>
                </div>
                <input 
                  type="range"
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  step={currentQuestion.step}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
                  value={(formData[currentQuestion.field] as number) || currentQuestion.min}
                  onChange={(e) => setFormData(prev => ({ ...prev, [currentQuestion.field]: Number(e.target.value) }))}
                />
                <button 
                  onClick={() => handleAnswer((formData[currentQuestion.field] as number) || currentQuestion.min)}
                  className="w-full bg-[#5A5A40] text-white py-3.5 rounded-2xl font-bold hover:bg-[#4A4A30] transition-colors"
                >
                  Confirm {(currentQuestion.field as string).replace(/([A-Z])/g, ' $1')}
                </button>
              </div>
            )}

            {/* General Input Renderer */}
            {(currentQuestion?.type === 'number' || currentQuestion?.type === 'text') && (
              <div className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-xl flex items-center gap-3">
                <input 
                  type={currentQuestion.type === 'number' ? 'number' : 'text'}
                  placeholder={currentQuestion.placeholder}
                  className="flex-1 bg-transparent border-none outline-none px-4 py-2 font-sans font-medium"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && inputValue && handleAnswer(currentQuestion.type === 'number' ? Number(inputValue) : inputValue)}
                />
                <button 
                  disabled={!inputValue}
                  onClick={() => handleAnswer(currentQuestion.type === 'number' ? Number(inputValue) : inputValue)}
                  className="w-12 h-12 bg-[#5A5A40] text-white rounded-2xl flex items-center justify-center hover:bg-[#4A4A30] transition-colors disabled:opacity-30"
                >
                  <Send size={20} />
                </button>
              </div>
            )}

            {/* Back Button */}
            {currentIndex > 0 && (
              <div className="text-center">
                <button 
                  onClick={handleBack}
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#5A5A40] transition-colors"
                >
                  Back to previous question
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
