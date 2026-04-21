import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, ShieldCheck, Zap, TrendingUp, 
  ChevronRight, MessageSquare, Building2, 
  ArrowRight, CheckCircle2, Globe, IndianRupee,
  User, Briefcase, Home, Landmark, Activity, FileText,
  CreditCard
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onStartLoan: (type: string) => void;
  onViewCreditTool: (tool: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onStartLoan, onViewCreditTool }) => {
  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1a1a1a] font-serif selection:bg-[#5A5A40] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#F5F5F0]/80 backdrop-blur-md border-b border-[#5A5A40]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BotIcon />
            <span className="text-2xl font-bold tracking-tight">CreditGenAI</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogin}
              className="bg-[#5A5A40] text-white px-6 py-2 rounded-full hover:bg-[#4A4A30] transition-all shadow-lg hover:shadow-xl font-bold text-sm font-sans uppercase tracking-widest"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-8">
              Get Free Credit Report & <br />
              <span className="italic text-[#5A5A40]">Best Loan Offers.</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#5A5A40] max-w-2xl mx-auto mb-16 font-serif italic">
              Check your score in 2 minutes and access loans from 30+ banks.
            </p>
          </motion.div>

          {/* Service Grid - Row 1: Loan Products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <ProductCard 
              icon={<User />}
              title="Personal Loan"
              tag="Instant Disbursal"
              onClick={() => onStartLoan('Personal')}
            />
            <ProductCard 
              icon={<Briefcase />}
              title="Business Loan"
              tag="No Collateral"
              onClick={() => onStartLoan('Business')}
            />
            <ProductCard 
              icon={<Home />}
              title="Home Loan"
              tag="Low Interest"
              onClick={() => onStartLoan('Home')}
            />
            <ProductCard 
              icon={<Landmark />}
              title="Loan Against Property"
              tag="High Value"
              onClick={() => onStartLoan('LAP')}
            />
          </div>

          {/* Service Grid - Row 2: Credit Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ToolCard 
              icon={<Activity />}
              title="Free Credit Score"
              tag="Monthly Update"
              onClick={() => onViewCreditTool('score')}
            />
            <ToolCard 
              icon={<FileText />}
              title="Credit Health Report"
              tag="Deep analysis"
              onClick={() => onViewCreditTool('health')}
            />
            <ToolCard 
              icon={<Zap />}
              title="Score Improvement Plan"
              tag="Personalized coaching"
              onClick={() => onViewCreditTool('improvement')}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-[#5A5A40]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <BotIcon size={24} />
              <span className="text-xl font-bold">CreditGenAI</span>
            </div>
            <div className="flex gap-8 text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40]">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Contact Us</a>
            </div>
            <p className="text-xs text-gray-400 font-sans uppercase tracking-widest">
              © 2026 CreditGenAI. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const BotIcon = ({ size = 32 }: { size?: number }) => (
  <div className="bg-[#5A5A40] text-white p-1.5 rounded-xl shadow-inner shrink-0" style={{ width: size + 12, height: size + 12 }}>
    <Sparkles style={{ width: size, height: size }} />
  </div>
);

const ProductCard: React.FC<{ icon: React.ReactNode; title: string, tag: string, onClick: () => void }> = ({ icon, title, tag, onClick }) => (
  <motion.button
    whileHover={{ y: -8, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="p-8 bg-white rounded-[40px] border border-gray-100 hover:border-[#5A5A40]/30 transition-all shadow-sm hover:shadow-xl text-left flex flex-col items-start group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5F5F0]/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 group-hover:bg-[#5A5A40]/5 transition-colors" />
    <div className="w-14 h-14 bg-[#F5F5F0] rounded-2xl flex items-center justify-center text-[#5A5A40] mb-6 group-hover:bg-[#5A5A40] group-hover:text-white transition-all shadow-inner">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-7 h-7' })}
    </div>
    <span className="inline-block px-3 py-1 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] font-sans uppercase tracking-widest font-bold mb-3">
      {tag}
    </span>
    <h3 className="text-xl font-bold leading-tight flex items-center gap-2 group-hover:text-[#5A5A40] transition-colors">
      {title} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
    </h3>
  </motion.button>
);

const ToolCard: React.FC<{ icon: React.ReactNode; title: string, tag: string, onClick: () => void }> = ({ icon, title, tag, onClick }) => (
  <motion.button
    whileHover={{ y: -5, scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className="p-6 bg-white/50 backdrop-blur-sm rounded-[32px] border border-[#5A5A40]/10 hover:border-[#5A5A40]/30 transition-all flex items-center gap-6 group text-left"
  >
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#5A5A40] shadow-sm group-hover:bg-[#5A5A40] group-hover:text-white transition-all">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    </div>
    <div>
      <h4 className="font-bold text-lg leading-tight group-hover:text-[#5A5A40] transition-colors">{title}</h4>
      <p className="text-[10px] font-sans uppercase tracking-widest text-gray-400 font-bold mt-1">{tag}</p>
    </div>
  </motion.button>
);
