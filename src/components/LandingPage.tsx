import React from 'react';
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
    <div className="min-h-app bg-[#F2F5FB] text-[#0D1626] font-sans selection:bg-[#1B6EF3] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#F2F5FB]/80 backdrop-blur-md border-b border-[#E4EAF4] pt-safe px-safe">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BotIcon />
            <span className="text-2xl font-bold font-display tracking-tight">CreditGenAI</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogin}
              className="bg-[#1B6EF3] text-white px-6 py-2.5 rounded-lg hover:bg-[#0F57D8] transition-all shadow-md hover:shadow-lg font-semibold text-sm uppercase tracking-wide"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6 text-[#0D1626] font-display">
              Smart Loan Marketplace <br />
              <span className="text-[#1B6EF3]">Trusted by thousands</span>
            </h1>
            <p className="text-lg md:text-xl text-[#4A5878] max-w-3xl mx-auto mb-12 font-medium">
              Compare and apply for loans from 30+ banks in minutes. Get instant approvals with transparent terms and competitive rates.
            </p>
          </div>

          {/* Service Grid - Row 1: Loan Products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <ProductCard 
              icon={<User />}
              title="Personal Loan"
              tag="Quick Disbursal"
              onClick={() => onStartLoan('Personal')}
            />
            <ProductCard 
              icon={<Briefcase />}
              title="Business Loan"
              tag="Flexible Terms"
              onClick={() => onStartLoan('Business')}
            />
            <ProductCard 
              icon={<Home />}
              title="Home Loan"
              tag="Low Rates"
              onClick={() => onStartLoan('Home')}
            />
            <ProductCard 
              icon={<Landmark />}
              title="Loan Against Property"
              tag="High Amount"
              onClick={() => onStartLoan('LAP')}
            />
          </div>

          {/* Service Grid - Row 2: Credit Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <ToolCard 
              icon={<Activity />}
              title="Free Credit Score"
              tag="Real-time updates"
              onClick={() => onViewCreditTool('score')}
            />
            <ToolCard 
              icon={<FileText />}
              title="Credit Report"
              tag="Instant access"
              onClick={() => onViewCreditTool('health')}
            />
            <ToolCard 
              icon={<Zap />}
              title="Score Improvement"
              tag="AI-powered tips"
              onClick={() => onViewCreditTool('improvement')}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-[#E4EAF4]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <BotIcon size={24} />
              <span className="text-xl font-bold font-display">CreditGenAI</span>
            </div>
            <div className="flex gap-6 text-xs font-sans uppercase tracking-wide font-semibold text-[#4A5878] hover:text-[#1B6EF3]">
              <a href="#" className="hover:text-[#1B6EF3] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#1B6EF3] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#1B6EF3] transition-colors">Contact</a>
            </div>
            <p className="text-xs text-[#8E9BB8] font-sans uppercase tracking-wide">
              © 2026 CreditGenAI. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const BotIcon = ({ size = 32 }: { size?: number }) => (
  <div className="bg-[#1B6EF3] text-white p-1.5 rounded-lg shadow-md shrink-0 font-display font-bold" style={{ width: size + 12, height: size + 12 }}>
    <Sparkles style={{ width: size, height: size }} />
  </div>
);

const ProductCard: React.FC<{ icon: React.ReactNode; title: string, tag: string, onClick: () => void }> = ({ icon, title, tag, onClick }) => (
  <button
    onClick={onClick}
    className="p-6 bg-white rounded-[14px] border border-[#E4EAF4] hover:border-[#1B6EF3]/50 shadow-sm hover:shadow-md text-left flex flex-col items-start group relative overflow-hidden active:scale-[0.98] transition-[border-color,box-shadow,transform]"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-[#EBF2FF] rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:opacity-100 opacity-50 transition-opacity" />
    <div className="w-12 h-12 bg-[#EBF2FF] rounded-lg flex items-center justify-center text-[#1B6EF3] mb-4 group-hover:bg-[#1B6EF3] group-hover:text-white transition-colors shadow-sm relative z-10">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    </div>
    <span className="inline-block px-2.5 py-1 rounded-md bg-[#EBF2FF] text-[#1253C4] text-[10px] font-sans font-semibold mb-2 uppercase tracking-wide relative z-10">
      {tag}
    </span>
    <h3 className="text-base font-semibold leading-tight text-[#0D1626] group-hover:text-[#1B6EF3] transition-colors font-display relative z-10">
      {title}
    </h3>
  </button>
);

const ToolCard: React.FC<{ icon: React.ReactNode; title: string, tag: string, onClick: () => void }> = ({ icon, title, tag, onClick }) => (
  <button
    onClick={onClick}
    className="p-5 bg-white rounded-[14px] border border-[#E4EAF4] hover:border-[#1B6EF3]/50 shadow-sm hover:shadow-md flex items-start gap-4 group text-left active:scale-[0.99] transition-[border-color,box-shadow,transform]"
  >
    <div className="w-10 h-10 bg-[#EBF2FF] rounded-lg flex items-center justify-center text-[#1B6EF3] shadow-sm group-hover:bg-[#1B6EF3] group-hover:text-white transition-colors flex-shrink-0">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
    </div>
    <div className="min-w-0">
      <h4 className="font-semibold text-sm leading-tight text-[#0D1626] group-hover:text-[#1B6EF3] transition-colors font-display">{title}</h4>
      <p className="text-[11px] font-sans text-[#8E9BB8] uppercase tracking-wide font-medium mt-1">{tag}</p>
    </div>
  </button>
);
