import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, ShieldCheck, Zap, TrendingUp, 
  ChevronRight, MessageSquare, Building2, 
  ArrowRight, CheckCircle2, Globe, IndianRupee
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onQuickLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onQuickLogin }) => {
  const hasLoggedInBefore = localStorage.getItem('preferQuickLogin') === 'true';

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1a1a1a] font-serif selection:bg-[#5A5A40] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#F5F5F0]/80 backdrop-blur-md border-b border-[#5A5A40]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#5A5A40] w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">CreditGenAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-sans uppercase tracking-widest font-bold text-[#5A5A40]">
            <a href="#features" className="hover:text-[#4A4A30] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#4A4A30] transition-colors">How it Works</a>
            <div className="flex items-center gap-4">
              {hasLoggedInBefore && onQuickLogin && (
                <button 
                  onClick={onQuickLogin}
                  className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] hover:underline"
                >
                  Quick Login
                </button>
              )}
              <button 
                onClick={onLogin}
                className="bg-[#5A5A40] text-white px-6 py-2 rounded-full hover:bg-[#4A4A30] transition-all shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
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
            <span className="inline-block px-4 py-1 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] text-xs font-sans uppercase tracking-widest font-bold mb-6">
              The Future of Indian Finance
            </span>
            <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] tracking-tight mb-8">
              Your AI-Powered <br />
              <span className="italic text-[#5A5A40]">Loan Marketplace.</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#5A5A40] max-w-2xl mx-auto mb-12 font-serif italic">
              Stop searching, start chatting. Get personalized loan offers from top Indian banks in seconds using our advanced AI advisor.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button 
                onClick={hasLoggedInBefore && onQuickLogin ? onQuickLogin : onLogin}
                className="w-full md:w-auto bg-[#5A5A40] text-white px-10 py-5 rounded-full text-xl font-bold hover:bg-[#4A4A30] transition-all shadow-2xl flex items-center justify-center gap-3 group"
              >
                {hasLoggedInBefore ? 'Welcome Back' : 'Start Your Journey'} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              {hasLoggedInBefore && (
                <button 
                  onClick={onLogin}
                  className="text-xs font-sans uppercase tracking-widest text-[#5A5A40] font-bold hover:underline"
                >
                  Use different account
                </button>
              )}
              {!hasLoggedInBefore && (
                <p className="text-sm font-sans uppercase tracking-widest text-[#5A5A40] font-bold">
                  No Credit Score Impact
                </p>
              )}
            </div>
          </motion.div>

          {/* Hero Image / Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="aspect-video bg-white rounded-[40px] shadow-2xl border border-[#5A5A40]/10 overflow-hidden p-4">
              <div className="w-full h-full bg-[#F5F5F0] rounded-[32px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#5A5A40] via-transparent to-transparent" />
                </div>
                <div className="relative z-10 text-center space-y-4">
                  <div className="flex items-center gap-4 justify-center">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center"><IndianRupee className="text-[#5A5A40]" /></div>
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center"><Building2 className="text-[#5A5A40]" /></div>
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center"><Zap className="text-[#5A5A40]" /></div>
                  </div>
                  <p className="text-[#5A5A40] font-bold tracking-widest uppercase text-xs">AI-Driven Comparison Engine</p>
                </div>
              </div>
            </div>
            {/* Floating Stats */}
            <div className="absolute -top-10 -right-10 hidden lg:block">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-[#5A5A40]/10">
                <p className="text-3xl font-bold">₹100Cr+</p>
                <p className="text-xs font-sans uppercase tracking-widest text-[#5A5A40]">Loans Processed</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<MessageSquare />}
              title="AI Chat Advisor"
              description="Chat with our intelligent bot to understand loan terms, calculate EMIs, and get expert financial advice."
            />
            <FeatureCard 
              icon={<TrendingUp />}
              title="Real-Time Comparison"
              description="Instantly compare interest rates, processing fees, and tenures from 50+ top Indian banks and NBFCs."
            />
            <FeatureCard 
              icon={<ShieldCheck />}
              title="Secure Applications"
              description="Your data is encrypted and shared only with the banks you choose. We prioritize your privacy above all."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1">
              <h2 className="text-5xl md:text-7xl font-bold mb-12 leading-tight">
                Three Simple Steps to <br />
                <span className="italic text-[#5A5A40]">Your Dream Loan.</span>
              </h2>
              <div className="space-y-12">
                <Step number="01" title="Create Your Profile" description="Answer a few basic questions about your income and requirements." />
                <Step number="02" title="Chat & Compare" description="Use our AI to find the perfect match among hundreds of bank offers." />
                <Step number="03" title="Apply Instantly" description="Submit your application directly and track its status in real-time." />
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-[#5A5A40] p-12 rounded-[60px] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <h3 className="text-3xl font-bold mb-6">Ready to start?</h3>
                <p className="text-white/70 mb-12 text-lg italic">Join thousands of Indians who have found their perfect financial partner through CreditGenAI.</p>
                <button 
                  onClick={onLogin}
                  className="bg-white text-[#5A5A40] px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all flex items-center gap-2"
                >
                  Get Started Now <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-[#5A5A40]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-[#5A5A40] w-6 h-6" />
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

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-8 rounded-[40px] border border-gray-100 hover:border-[#5A5A40]/20 transition-all hover:shadow-xl group">
    <div className="w-14 h-14 bg-[#F5F5F0] rounded-2xl flex items-center justify-center text-[#5A5A40] mb-6 group-hover:scale-110 transition-transform">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-7 h-7' })}
    </div>
    <h3 className="text-2xl font-bold mb-4">{title}</h3>
    <p className="text-[#5A5A40] font-serif italic leading-relaxed">{description}</p>
  </div>
);

const Step: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
  <div className="flex gap-8">
    <span className="text-4xl font-bold text-[#5A5A40]/20">{number}</span>
    <div>
      <h4 className="text-2xl font-bold mb-2">{title}</h4>
      <p className="text-[#5A5A40] font-serif italic">{description}</p>
    </div>
  </div>
);
