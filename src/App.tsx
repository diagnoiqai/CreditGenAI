import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { UserProfile } from './types';
import { apiService } from './services/apiService';
import { Login } from './components/Login';
import { LoanForm } from './components/LoanForm';
import { ChatWindow } from './components/ChatWindow';
import { AdminPanel } from './components/AdminPanel';
import { LandingPage } from './components/LandingPage';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User as UserIcon, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const isAdmin = profile?.role === 'admin' || user?.email === 'theskyaigiants@gmail.com';
  const isStaff = profile?.role === 'staff';

  // Auto-show login if previously logged in
  useEffect(() => {
    if (authReady && !user && localStorage.getItem('preferQuickLogin') === 'true') {
      setShowLogin(true);
    }
  }, [authReady, user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        localStorage.setItem('preferQuickLogin', 'true');
        try {
          // Fetch profile from PostgreSQL via API
          let userProfile = await apiService.getUserProfile(u.uid);
          
          if (!userProfile && u.email) {
            // Check for staff invite
            const invite = await apiService.checkInvite(u.email);
            if (invite) {
              // Auto-create profile for invited staff/admin
              const newProfile: UserProfile = {
                uid: u.uid,
                email: u.email,
                displayName: u.displayName || u.email.split('@')[0],
                role: invite.role as 'admin' | 'staff' | 'user',
                permissions: invite.permissions || [],
                monthlyIncome: 0,
                employmentType: 'Salaried',
                companyType: 'Other',
                companyName: 'N/A',
                workExperience: '0',
                totalExperience: '0',
                city: 'N/A',
                existingEMIs: 0,
                age: 25,
                cibilScore: 750,
                loanAmountRequired: 0,
                loanType: 'Personal Loan'
              };
              await apiService.saveUserProfile(newProfile);
              userProfile = newProfile;
            }
          }

          if (userProfile) {
            setProfile(userProfile);
            
            // Bootstrap admin role if email matches
            if (u.email === 'theskyaigiants@gmail.com' && userProfile.role !== 'admin') {
              const updatedProfile = { ...userProfile, role: 'admin' as const };
              await apiService.saveUserProfile(updatedProfile);
              setProfile(updatedProfile);
            }
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('preferQuickLogin');
    signOut(auth);
  };

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
    const { googleProvider } = await import('./firebase');
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
      return <AdminPanel profile={profile} user={user} isStaff={isStaff} />;
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
              onClick={handleLogout}
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
          <LoanForm onComplete={setProfile} />
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
            onComplete={(p) => {
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
    <div className="min-h-screen bg-[#F5F5F0] text-[#1a1a1a] flex flex-col">
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
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            <div className="max-w-7xl mx-auto w-full p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-[#5A5A40] w-6 h-6" />
                  <h1 className="text-2xl font-serif font-bold">CreditGenAI</h1>
                  {(isAdmin || isStaff) && (
                    <span className="text-[10px] bg-[#5A5A40] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ml-2">
                      {isAdmin ? 'Admin' : 'Staff'} Portal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  {!isAdmin && !isStaff && profile && (
                    <button 
                      onClick={() => setShowProfileEdit(!showProfileEdit)}
                      className={`flex items-center gap-2 text-xs font-sans uppercase tracking-widest transition-colors ${showProfileEdit ? 'text-blue-600' : 'text-[#5A5A40]'}`}
                    >
                      <UserIcon className="w-4 h-4" /> {showProfileEdit ? 'Cancel Edit' : 'Edit Profile'}
                    </button>
                  )}
                  <div className="hidden md:flex items-center gap-2 text-sm text-[#5A5A40]">
                    <UserIcon className="w-4 h-4" />
                    <span className="font-serif">{profile?.displayName || user?.displayName || user?.email}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-[#5A5A40] hover:text-[#4A4A30] transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
              
              <div className="flex-1">
                {renderContent()}
              </div>
            </div>
            
            <footer className="py-8 border-t border-[#5A5A40]/10 mt-auto">
              <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 opacity-50">
                  <Sparkles className="text-[#5A5A40] w-4 h-4" />
                  <span className="text-sm font-bold font-serif">CreditGenAI</span>
                </div>
                <p className="text-[10px] text-gray-400 font-sans uppercase tracking-widest">
                  © 2026 CreditGenAI. Secure AI-Powered Financial Marketplace.
                </p>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
