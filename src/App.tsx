import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useUserJourney } from './hooks/useUserJourney';
import { apiService } from './services/apiService';
import { clearAICache, viewAICache, getAICacheData } from './services/geminiService';
import { Login } from './components/Login';
import { ChatWindow } from './components/ChatWindow';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { LandingPage } from './components/LandingPage';
import { ChatFormCollector } from './components/ChatFormCollector';
import { ProfileEditor } from './components/ProfileEditor';
import { ResumeScreen } from './components/ResumeScreen';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User as UserIcon, Sparkles, ArrowLeft } from 'lucide-react';
import { LoanType, UserProfile } from './types';

export default function App() {
  const {
    profile,
    loading: authLoading,
    authReady,
    isAdmin,
    isStaff,
    setProfile,
    logout
  } = useAuth();

  const { nextStep, userType, activeProfile, isLoading: journeyLoading, startSession, updateProfile, clearSession } = useUserJourney();

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [manualShowLogin, setManualShowLogin] = useState(false);
  const [hasConfirmedResume, setHasConfirmedResume] = useState(false);

  // Expose cache utilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).clearCache = clearAICache;
      (window as any).viewCache = viewAICache;
      (window as any).getCache = getAICacheData;
    }
  }, []);

  if (!authReady || authLoading || journeyLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#5A5A40] border-t-transparent rounded-full animate-spin" />
          <p className="font-serif italic text-[#5A5A40]">CreditGenAI is loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    await clearSession();
    setManualShowLogin(false);
    setShowProfileEdit(false);
  };

  const renderContent = () => {
    // Admin / Staff View
    if (isAdmin || isStaff) {
      return <AdminPanel profile={profile!} onLogout={logout} />;
    }

    // Manual Login Override (Triggered from Sign-in pitches or Manual Login button)
    if (manualShowLogin && !profile) {
      return (
        <div className="relative h-full">
          <button 
             onClick={() => setManualShowLogin(false)}
             className="absolute top-8 left-8 text-sm font-sans uppercase tracking-widest text-[#5A5A40] hover:underline z-50 flex items-center gap-1"
          >
            <Sparkles size={14} /> Back to Application
          </button>
          <Login />
        </div>
      );
    }

    // Manual Profile Edit
    if (showProfileEdit && profile) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <ProfileEditor 
            profile={profile} 
            onClose={() => setShowProfileEdit(false)}
            onUpdate={(p) => {
              setProfile(p);
              setShowProfileEdit(false);
            }} 
          />
        </div>
      );
    }

    // Resume Logic
    const needsResumeCheck = (nextStep === 'CHAT' || (nextStep === 'FORM' && activeProfile?.loanType)) && !hasConfirmedResume;
    if (needsResumeCheck && !manualShowLogin) {
      return (
        <ResumeScreen 
          loanType={activeProfile?.loanType || 'Personal Loan'}
          onContinue={() => setHasConfirmedResume(true)}
          onStartFresh={async () => {
             await clearSession();
             setHasConfirmedResume(true);
          }}
        />
      );
    }

    // FUNNEL ROUTING
    switch (nextStep) {
      case 'LANDING':
        return manualShowLogin ? (
          <Login />
        ) : (
          <LandingPage 
            onLogin={() => setManualShowLogin(true)} 
            onStartLoan={(type) => {
              const loanTypeMap: Record<string, LoanType> = {
                'Personal': 'Personal Loan',
                'Business': 'Business Loan',
                'Home': 'Home Loan',
                'LAP': 'Loan Against Property'
              };
              startSession({ loanType: loanTypeMap[type] || 'Personal Loan' });
              setHasConfirmedResume(true);
            }}
            onViewCreditTool={(tool) => {
              // For now, let's just start a session or show a message
              // maybe a specific tool landing later
              startSession({ lastUpdated: `Tool: ${tool}` });
              setHasConfirmedResume(true);
            }}
          />
        );
      case 'LOGIN':
        return <Login />;
      case 'FORM':
        // For conversational flow on desktop, we show the Dashboard with the form inside it
        // On mobile, it still feels like a full screen chat
        return (
          <Dashboard 
            profile={activeProfile!} 
            isFormMode={true} 
            onLoginRequest={() => {
              if (userType === 'GUEST') {
                setManualShowLogin(true);
              }
            }}
            onFormComplete={async (p) => {
              const completeProfile = { ...p, formCompleted: true };
              if (userType === 'PHONE_VERIFIED' && profile) {
                await apiService.updateUserProfile(profile.uid, completeProfile);
                setProfile({ ...profile, ...completeProfile });
              } else if (userType === 'GUEST') {
                updateProfile(completeProfile);
              }
              localStorage.removeItem('chatFormProgress');
            }}
          />
        );
      case 'CHAT':
        return <Dashboard profile={activeProfile!} />;
      default:
        return (
          <LandingPage 
            onLogin={() => setManualShowLogin(true)} 
            onStartLoan={(type) => {
              const loanTypeMap: Record<string, LoanType> = {
                'Personal': 'Personal Loan',
                'Business': 'Business Loan',
                'Home': 'Home Loan',
                'LAP': 'Loan Against Property'
              };
              startSession({ loanType: loanTypeMap[type] || 'Personal Loan' });
            }}
            onViewCreditTool={(tool) => startSession({ lastUpdated: `Tool: ${tool}` })}
          />
        );
    }
  };

  const isFullAppView = nextStep === 'CHAT' || nextStep === 'FORM' || isAdmin || isStaff;

  return (
    <div className={`bg-[#F5F5F0] text-[#1a1a1a] flex flex-col min-h-screen`}>
      <AnimatePresence mode="wait">
        <motion.div key={nextStep + (manualShowLogin ? '-login' : '')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
          
          {/* Main App Bar (Only shown when not on landing/login) */}
          {isFullAppView && (
            <div className="max-w-[1800px] mx-auto w-full p-2 md:p-4 shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4 px-2 md:px-4 gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-[#5A5A40] w-5 h-5 md:w-6 h-6" />
                  <div>
                    <h1 className="text-xl md:text-2xl font-serif font-bold">CreditGenAI</h1>
                    {nextStep === 'CHAT' && (
                      <div className="flex items-center gap-1.5 -mt-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-sans uppercase tracking-widest text-[#5A5A40]/50 font-bold">AI Assistant Online</span>
                      </div>
                    )}
                  </div>
                  {(isAdmin || isStaff) && (
                    <span className="text-[8px] md:text-[10px] bg-[#5A5A40] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ml-1 md:ml-2">
                      {isAdmin ? 'Admin' : 'Staff'}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 md:gap-6">
                  {profile && !isAdmin && !isStaff && (
                    <button 
                      onClick={() => setShowProfileEdit(!showProfileEdit)}
                      className={`flex items-center gap-2 text-[10px] md:text-xs font-sans uppercase tracking-widest transition-colors ${showProfileEdit ? 'text-blue-600' : 'text-[#5A5A40]'}`}
                    >
                      <UserIcon className="w-3 h-3 md:w-4 h-4" /> 
                      <span className="hidden xs:inline">{showProfileEdit ? 'Cancel Edit' : 'Edit Profile'}</span>
                    </button>
                  )}
                  {profile && (
                    <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm text-[#5A5A40]">
                      <UserIcon className="w-3 h-3 md:w-4 h-4" />
                      <span className="font-serif truncate max-w-[100px] md:max-w-none">{profile.displayName || profile.phone}</span>
                    </div>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-[10px] md:text-xs font-sans uppercase tracking-widest text-[#5A5A40] hover:text-[#4A4A30] transition-colors"
                  >
                    <LogOut className="w-3 h-3 md:w-4 h-4" /> 
                    <span className="hidden xs:inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0">
            {manualShowLogin && nextStep === 'LANDING' ? (
              <div className="relative h-full">
                <button 
                   onClick={() => setManualShowLogin(false)}
                   className="absolute top-8 left-8 text-sm font-sans uppercase tracking-widest text-[#5A5A40] hover:underline z-10"
                >
                  ← Back
                </button>
                <Login />
              </div>
            ) : renderContent()}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
