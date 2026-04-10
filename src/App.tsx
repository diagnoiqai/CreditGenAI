import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { apiService } from './services/apiService';
import { Login } from './components/Login';
import { LoanForm } from './components/LoanForm';
import { ChatWindow } from './components/ChatWindow';
import { AdminPanel } from './components/AdminPanel';
import { LandingPage } from './components/LandingPage';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User as UserIcon, Sparkles } from 'lucide-react';

export default function App() {
  const {
    user,
    profile,
    loading,
    authReady,
    isAdmin,
    isStaff,
    setProfile,
    logout
  } = useAuth();

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Auto-show login if previously logged in
  useEffect(() => {
    if (authReady && !user && localStorage.getItem('preferQuickLogin') === 'true') {
      setShowLogin(true);
    }
  }, [authReady, user]);

  if (!authReady || (user && loading)) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#5A5A40] border-t-transparent rounded-full animate-spin" />
          <p className="font-serif italic text-[#5A5A40]">CreditGenAI is loading...</p>
        </div>
      </div>
    );
  }

  const handleQuickGoogleLogin = async () => {
    const { auth, googleProvider } = await import('./firebase');
    const { signInWithPopup } = await import('firebase/auth');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Quick login failed:', error);
      setShowLogin(true);
    }
  };

  const renderContent = () => {
    if (isAdmin || isStaff) {
      return (
        <AdminPanel 
          profile={profile!} 
          user={user!} 
          isStaff={isStaff} 
          onLogout={logout}
        />
      );
    }

    if (!profile) {
      return (
        <div className="max-w-4xl mx-auto p-4 pt-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-[#5A5A40] w-8 h-8" />
              <h1 className="text-3xl font-serif font-bold">CreditGenAI</h1>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-sm font-sans uppercase tracking-widest text-[#5A5A40] hover:text-[#4A4A30] transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold mb-4">Welcome, {user?.displayName || user?.email}!</h2>
            <p className="text-lg text-[#5A5A40] font-serif italic max-w-xl mx-auto">
              Let's get started by collecting some basic details to find the best loan options for you.
            </p>
          </div>
          <LoanForm 
            onComplete={async (p) => {
              await apiService.saveUserProfile(p);
              setProfile(p);
            }} 
            initialProfile={user ? { uid: user.uid, email: user.email! } : undefined}
          />
        </div>
      );
    }

    if (showProfileEdit) {
      return (
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-bold mb-2">Update Your Details</h2>
            <p className="text-[#5A5A40] font-serif italic">Correct any mistakes to get more accurate loan offers.</p>
          </div>
          <LoanForm 
            initialProfile={profile} 
            onComplete={async (p) => {
              await apiService.saveUserProfile(p);
              setProfile(p);
              setShowProfileEdit(false);
            }} 
          />
        </div>
      );
    }

    return <ChatWindow profile={profile} />;
  };

  return (
    <div className={`bg-[#F5F5F0] text-[#1a1a1a] flex flex-col ${user ? 'h-screen' : 'min-h-screen'}`}>
      <AnimatePresence mode="wait">
        {!user ? (
          showLogin ? (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="relative">
                <button 
                  onClick={() => setShowLogin(false)}
                  className="absolute top-8 left-8 text-sm font-sans uppercase tracking-widest text-[#5A5A40] hover:underline z-10"
                >
                  ← Back to Home
                </button>
                <Login />
              </div>
            </motion.div>
          ) : (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingPage 
                onLogin={() => setShowLogin(true)} 
                onQuickLogin={handleQuickGoogleLogin}
              />
            </motion.div>
          )
        ) : (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            <div className="max-w-[1800px] mx-auto w-full p-2 md:p-4 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4 px-2 md:px-4 gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-[#5A5A40] w-5 h-5 md:w-6 h-6" />
                  <h1 className="text-xl md:text-2xl font-serif font-bold">CreditGenAI</h1>
                  {(isAdmin || isStaff) && (
                    <span className="text-[8px] md:text-[10px] bg-[#5A5A40] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ml-1 md:ml-2">
                      {isAdmin ? 'Admin' : 'Staff'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                  {!isAdmin && !isStaff && profile && (
                    <button 
                      onClick={() => setShowProfileEdit(!showProfileEdit)}
                      className={`flex items-center gap-2 text-[10px] md:text-xs font-sans uppercase tracking-widest transition-colors ${showProfileEdit ? 'text-blue-600' : 'text-[#5A5A40]'}`}
                    >
                      <UserIcon className="w-3 h-3 md:w-4 h-4" /> 
                      <span className="hidden xs:inline">{showProfileEdit ? 'Cancel Edit' : 'Edit Profile'}</span>
                    </button>
                  )}
                  <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm text-[#5A5A40]">
                    <UserIcon className="w-3 h-3 md:w-4 h-4" />
                    <span className="font-serif truncate max-w-[100px] md:max-w-none">{profile?.displayName || user?.displayName || user?.email}</span>
                  </div>
                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 text-[10px] md:text-xs font-sans uppercase tracking-widest text-[#5A5A40] hover:text-[#4A4A30] transition-colors"
                  >
                    <LogOut className="w-3 h-3 md:w-4 h-4" /> 
                    <span className="hidden xs:inline">Logout</span>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0">
                {renderContent()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
