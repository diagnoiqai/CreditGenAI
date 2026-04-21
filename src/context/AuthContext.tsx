import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  login: (uid: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isStaff = profile?.role === 'staff';

  useEffect(() => {
    const initializeAuth = async () => {
      const savedUserId = localStorage.getItem('creditgenai_uid');
      const sessionToken = localStorage.getItem('creditgenai_token');

      if (savedUserId && sessionToken) {
        try {
          const userProfile = await apiService.getUserProfile(savedUserId);
          if (userProfile) {
            setProfile(userProfile);
          } else {
            localStorage.removeItem('creditgenai_uid');
            localStorage.removeItem('creditgenai_token');
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
        }
      }
      setAuthReady(true);
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (uid: string, token: string) => {
    localStorage.setItem('creditgenai_uid', uid);
    localStorage.setItem('creditgenai_token', token);
    
    // Merge guest session data if it exists
    const guestData = localStorage.getItem('creditgenai_guest_session');
    let guestProfile: Partial<UserProfile> = {};
    if (guestData) {
      try {
        const parsed = JSON.parse(guestData);
        guestProfile = parsed.profile || {};
      } catch (e) {}
    }

    const userProfile = await apiService.getUserProfile(uid);
    if (userProfile) {
      // Merge logic: prefer guest data for the current session, but keep verified ID/Auth fields from DB
      const mergedProfile = { ...userProfile, ...guestProfile };
      await apiService.updateUserProfile(uid, mergedProfile);
      setProfile(mergedProfile as UserProfile);
      
      // Clear guest session after merge
      localStorage.removeItem('creditgenai_guest_session');
    } else {
      setProfile(null);
    }
  };

  const logout = async () => {
    localStorage.removeItem('creditgenai_uid');
    localStorage.removeItem('creditgenai_token');
    localStorage.removeItem('preferQuickLogin');
    setProfile(null);
  };

  const refreshProfile = async () => {
    const uid = localStorage.getItem('creditgenai_uid');
    if (uid) {
      const updatedProfile = await apiService.getUserProfile(uid);
      setProfile(updatedProfile);
    }
  };

  return (
    <AuthContext.Provider value={{
      profile,
      loading,
      authReady,
      isAdmin,
      isStaff,
      login,
      logout,
      refreshProfile,
      setProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
