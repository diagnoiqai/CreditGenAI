import { GuestSessionData, UserProfile, ChatMessage } from '../types';
import { AUTH_CONFIG } from '../constants/auth';

const GUEST_SESSION_KEY = 'creditgenai_guest_session';

/**
 * Service for managing Guest Sessions in localStorage.
 * Guest sessions are used before phone authentication.
 */
export const guestSessionService = {
  /**
   * Creates a new guest session.
   */
  createGuestSession(initialProfile: Partial<UserProfile> = {}): GuestSessionData {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + AUTH_CONFIG.GUEST_SESSION_TTL_HOURS * 60 * 60 * 1000);

    const session: GuestSessionData = {
      sessionId,
      userType: 'guest',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      profile: { ...initialProfile, uid: sessionId, authMethod: 'guest' },
      chatMessages: [],
      formCompleted: false,
      readyForConversion: false,
    };

    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    return session;
  },

  /**
   * Retrieves the current guest session from localStorage.
   * Returns null if no session exists or if it has expired.
   */
  getGuestSession(): GuestSessionData | null {
    const saved = localStorage.getItem(GUEST_SESSION_KEY);
    if (!saved) return null;

    try {
      const session: GuestSessionData = JSON.parse(saved);
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);

      if (now > expiresAt) {
        console.log('[GuestSession] Session expired, clearing...');
        this.clearGuestSession();
        return null;
      }

      return session;
    } catch (e) {
      console.error('[GuestSession] Corrupt session data, clearing...', e);
      this.clearGuestSession();
      return null;
    }
  },

  /**
   * Updates the profile data within the guest session.
   */
  updateGuestProfile(profileUpdate: Partial<UserProfile>): GuestSessionData | null {
    const session = this.getGuestSession();
    if (!session) return null;

    const updatedSession: GuestSessionData = {
      ...session,
      profile: { ...session.profile, ...profileUpdate },
    };

    // If mandatory income fields are present, mark form as completed
    if (profileUpdate.monthlyIncome || profileUpdate.employmentType) {
      updatedSession.formCompleted = true;
    }

    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updatedSession));
    return updatedSession;
  },

  /**
   * Adds a message to the guest's chat history.
   */
  addChatMessage(message: ChatMessage): GuestSessionData | null {
    const session = this.getGuestSession();
    if (!session) return null;

    const updatedSession: GuestSessionData = {
      ...session,
      chatMessages: [...session.chatMessages, message],
    };

    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updatedSession));
    return updatedSession;
  },

  /**
   * Marks the session as ready for phone authentication conversion.
   */
  setReadyForConversion(ready: boolean = true): GuestSessionData | null {
    const session = this.getGuestSession();
    if (!session) return null;

    const updatedSession: GuestSessionData = {
      ...session,
      readyForConversion: ready,
    };

    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updatedSession));
    return updatedSession;
  },

  /**
   * Clears the guest session from localStorage.
   */
  clearGuestSession(): void {
    localStorage.removeItem(GUEST_SESSION_KEY);
  }
};
