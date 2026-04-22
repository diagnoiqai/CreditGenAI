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
      <div className="min-h-app bg-[#F5F5F0] flex items-center justify-center">
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
      case 'CHAT':
        return (
          <Dashboard 
            profile={activeProfile!}
            isOnboarding={nextStep === 'FORM'}
            onFormComplete={async (updates) => {
              updateProfile(updates);
              if (profile?.uid) {
                await apiService.updateUserProfile(profile.uid, updates);
                setProfile({ ...profile, ...updates });
              }
            }}
            onLoginRequest={() => {
              localStorage.setItem('chatFormProgress', JSON.stringify(activeProfile));
              setManualShowLogin(true);
            }}
            onBackToLanding={async () => {
              await clearSession();
              setHasConfirmedResume(false);
            }}
          />
        );
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
  const isDarkBar = nextStep === 'CHAT' || nextStep === 'FORM';

  return (
    <div className={`bg-[#F2F5FB] text-[#0D1626] font-sans h-app px-safe ${nextStep === 'LANDING' || nextStep === 'LOGIN' ? 'overflow-auto' : 'overflow-hidden'}`}>
      <div className="flex-1 flex flex-col min-h-0 h-full">
          
          {/* Main App Bar (Only shown when not on landing/login) */}
          {isFullAppView && (
            <header className={`h-16 shrink-0 flex items-center justify-between px-6 z-40 transition-colors border-b ${
              isDarkBar ? 'bg-white border-[#E4EAF4] shadow-sm' : 'bg-transparent border-transparent'
            }`}>
              <div className="flex items-center gap-3">
                <div onClick={() => {
                  clearSession();
                  setHasConfirmedResume(false);
                }} className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-8 h-8 bg-[#1B6EF3] rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h1 className="text-xl font-display font-bold text-[#0D1626]">CreditGenAI</h1>
                    <div className="flex items-center gap-1.5 leading-none">
                      <div className="w-1.5 h-1.5 bg-[#00A86B] rounded-full animate-pulse" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#4A5878]">AI Online</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {profile && (
                  <>
                    <button 
                      onClick={() => setShowProfileEdit(!showProfileEdit)}
                      className={`hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-colors ${showProfileEdit ? 'text-[#1B6EF3]' : 'text-[#4A5878] hover:text-[#1B6EF3]'}`}
                    >
                      <UserIcon size={16} /> 
                      <span className="truncate max-w-[120px]">{profile.displayName || profile.phone}</span>
                    </button>
                    {!isAdmin && !isStaff && (
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#DC2626] hover:text-[#991B1B] transition-colors"
                      >
                        <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </header>
          )}

          <div className="flex-1 relative min-h-0">
             {manualShowLogin && nextStep === 'LANDING' ? (
              <div className="h-full flex flex-col justify-center items-center">
                 <Login />
              </div>
            ) : renderContent()}
          </div>
      </div>
    </div>
  );
}
