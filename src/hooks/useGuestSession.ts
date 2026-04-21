import { useState, useEffect, useCallback } from 'react';
import { GuestSessionData, UserProfile, ChatMessage } from '../types';
import { guestSessionService } from '../services/guestSessionService';

/**
 * Hook to manage and interact with a Guest Session.
 * Automatically initializes a session if none exists.
 */
export function useGuestSession() {
  const [session, setSession] = useState<GuestSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const existing = guestSessionService.getGuestSession();
    if (existing) {
      setSession(existing);
    } else {
      // We don't necessarily create one immediately on every visitor's landing
      // but we could if we want to track them from the start.
      // Usually created when they first interact or "Get Started".
    }
    setIsLoading(false);
  }, []);

  const startSession = useCallback((initialProfile?: Partial<UserProfile>) => {
    const newSession = guestSessionService.createGuestSession(initialProfile);
    setSession(newSession);
    return newSession;
  }, []);

  const updateProfile = useCallback((profileUpdate: Partial<UserProfile>) => {
    const updated = guestSessionService.updateGuestProfile(profileUpdate);
    if (updated) setSession(updated);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    const updated = guestSessionService.addChatMessage(message);
    if (updated) setSession(updated);
  }, []);

  const setConversionReady = useCallback((ready: boolean) => {
    const updated = guestSessionService.setReadyForConversion(ready);
    if (updated) setSession(updated);
  }, []);

  const clearSession = useCallback(() => {
    guestSessionService.clearGuestSession();
    setSession(null);
  }, []);

  return {
    session,
    isLoading,
    isActive: !!session,
    startSession,
    updateProfile,
    addMessage,
    setConversionReady,
    clearSession,
    formCompleted: session?.formCompleted ?? false,
    readyForConversion: session?.readyForConversion ?? false
  };
}
