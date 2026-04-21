/**
 * Authentication and Session Constants
 */

export const AUTH_CONFIG = {
  OTP_EXPIRY_MINUTES: 10,
  GUEST_SESSION_TTL_HOURS: 24,
  MAX_OTP_ATTEMPTS_PER_HOUR: 3,
  
  // Indian Phone Format (10 digits, optional +91)
  PHONE_REGEX: /^(?:\+91|91)?[6789]\d{9}$/,
  
  USER_TYPES: {
    GUEST: 'guest' as const,
    PHONE_VERIFIED: 'phone_verified' as const,
  },
  
  AUTH_METHODS: {
    PHONE_OTP: 'phone_otp' as const,
    GUEST: 'guest' as const,
  }
};
