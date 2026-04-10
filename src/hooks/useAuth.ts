import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { UserProfile } from '../types';
import { apiService } from '../services/apiService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const isAdmin = profile?.role === 'admin' || user?.email === 'theskyaigiants@gmail.com';
  const isStaff = profile?.role === 'staff';

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
                gender: 'Male',
                maritalStatus: 'Single',
                cibilScore: 750,
                loanAmountRequired: 0,
                loanType: 'Personal Loan'
              };
              await apiService.saveUserProfile(newProfile);
              userProfile = newProfile;
            }
          }

          if (userProfile) {
            // Bootstrap admin role if email matches
            if (u.email === 'theskyaigiants@gmail.com' && userProfile.role !== 'admin') {
              const updatedProfile = { ...userProfile, role: 'admin' as const };
              await apiService.saveUserProfile(updatedProfile);
              setProfile(updatedProfile);
            } else {
              setProfile(userProfile);
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

  const logout = async () => {
    localStorage.removeItem('preferQuickLogin');
    await signOut(auth);
  };

  const refreshProfile = async () => {
    if (user) {
      const updatedProfile = await apiService.getUserProfile(user.uid);
      setProfile(updatedProfile);
    }
  };

  return {
    user,
    profile,
    loading,
    authReady,
    isAdmin,
    isStaff,
    logout,
    refreshProfile,
    setProfile
  };
}
