import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useGuestSession } from './useGuestSession';
import { UserProfile } from '../types';

export type JourneyStep = 
  | 'LANDING' 
  | 'LOGIN' 
  | 'FORM' 
  | 'CHAT' 
  | 'APPLY' 
  | 'COMPLETE';

/**
 * Hook to determine the user's current position in the 3-path funnel.
 */
export function useUserJourney() {
  const { profile, loading: authLoading } = useAuth();
  const { session, isLoading: guestLoading, formCompleted: guestFormCompleted, startSession, updateProfile, setConversionReady, clearSession } = useGuestSession();

  const nextStep = useMemo((): JourneyStep => {
    // 1. If still loading auth/session, wait
    if (authLoading || guestLoading) return 'LANDING';

    // 2. Path: Phone Verified User
    if (profile && profile.authMethod === 'phone_otp') {
      // If returning user has completed form
      return profile.formCompleted ? 'CHAT' : 'FORM';
    }

    // 3. Path: Guest User
    if (session) {
      return session.formCompleted ? 'CHAT' : 'FORM';
    }

    // 4. Default: User just landed
    return 'LANDING';
  }, [profile, session, authLoading, guestLoading]);

  const userType = useMemo(() => {
    if (profile?.authMethod === 'phone_otp') return 'PHONE_VERIFIED';
    if (session) return 'GUEST';
    return 'ANONYMOUS';
  }, [profile, session]);

  const activeProfile = useMemo(() => {
    if (profile) return profile;
    if (session) return session.profile as UserProfile;
    return null;
  }, [profile, session]);

  return {
    nextStep,
    userType,
    activeProfile,
    startSession,
    updateProfile,
    setConversionReady,
    clearSession,
    isGated: (nextStep === 'FORM' || nextStep === 'LOGIN'),
    isLoading: authLoading || guestLoading
  };
}
