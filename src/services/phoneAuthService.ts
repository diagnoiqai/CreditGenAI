import { pool } from '../config/db';
import { SMSServiceFactory } from './sms/SMSServiceFactory';
import { AUTH_CONFIG } from '../constants/auth';
import { VerificationResult, OTPResponse } from '../types';

/**
 * Service for handling Phone OTP Authentication logic.
 * Provider-agnostic.
 */
export const phoneAuthService = {
  /**
   * Initiates the OTP sending process.
   * Checks rate limits and expiry before calling the SMS provider.
   */
  async initiateSendOTP(phone: string): Promise<OTPResponse> {
    try {
      console.log(`[DEBUG] initiateSendOTP entry: ${phone}`);
      // 1. Sanitize and Normalize phone (take last 10 digits for Indian numbers)
      const numericPhone = phone.replace(/\D/g, '');
      const sanitizedPhone = numericPhone.length > 10 ? numericPhone.slice(-10) : numericPhone;
      
      console.log(`[DEBUG] Normalized phone: ${sanitizedPhone}`);

      if (!AUTH_CONFIG.PHONE_REGEX.test(phone) || sanitizedPhone.length !== 10) {
        console.warn(`[DEBUG] Format check failed for: ${phone}`);
        return { success: false, message: 'Invalid Indian phone number format' };
      }

      // 2. Check Rate Limit (max 3 OTPs per hour)
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      console.log(`[DEBUG] Verifying rate limits since ${hourAgo}...`);
      const rateLimitCheck = await pool.query(
        'SELECT COUNT(*) FROM dev.users WHERE phone = $1 AND otp_created_at > $2',
        [sanitizedPhone, hourAgo]
      );
      
      const count = parseInt(rateLimitCheck.rows[0].count);
      console.log(`[DEBUG] Attempts in last hour: ${count}`);

      if (count >= AUTH_CONFIG.MAX_OTP_ATTEMPTS_PER_HOUR) {
        console.warn(`[DEBUG] Rate limit blocked user: ${sanitizedPhone}`);
        return { success: false, message: 'Too many OTP attempts. Please try again after an hour.' };
      }

      // 3. Call SMS Provider via Factory
      console.log(`[DEBUG] Resolving SMS Provider...`);
      const provider = SMSServiceFactory.getSMSProvider();
      console.log(`[DEBUG] Executing sendOTP via ${provider.constructor.name}...`);
      const response = await provider.sendOTP(sanitizedPhone);
      console.log(`[DEBUG] Provider output:`, response);

      if (response.success) {
        // 4. Update Database
        console.log(`[DEBUG] Attempting database upsert...`);
        await pool.query(
          `INSERT INTO dev.users (uid, phone, user_type, auth_method, otp_created_at, otp_token)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
           ON CONFLICT (phone) DO UPDATE 
           SET otp_created_at = CURRENT_TIMESTAMP, 
               otp_token = $5,
               user_type = COALESCE(dev.users.user_type, $3),
               auth_method = $4`,
          [
            `user_${sanitizedPhone}`,
            sanitizedPhone,
            'phone_verified',
            'phone_otp',
            response.referenceId || 'pending'
          ]
        );
        console.log(`[DEBUG] Database upsert successful.`);
      }

      return response;
    } catch (error: any) {
      console.error('[DEBUG] CRITICAL ERROR in phoneAuthService.initiateSendOTP:', error);
      return { 
        success: false, 
        message: 'Internal server error during OTP initiation'
      };
    }
  },

  /**
   * Verifies the OTP code provided by the user.
   */
  async verifyOTP(phone: string, otp: string): Promise<VerificationResult> {
    try {
      const numericPhone = phone.replace(/\D/g, '');
      const sanitizedPhone = numericPhone.length > 10 ? numericPhone.slice(-10) : numericPhone;
      
      // 1. Check if user exists and OTP is not expired
      const userResult = await pool.query(
        'SELECT * FROM dev.users WHERE phone = $1',
        [sanitizedPhone]
      );

      if (userResult.rows.length === 0) {
        return { success: false, message: 'Phone number not found', isExistingUser: false, isNewUser: true, formCompleted: false };
      }

      const user = userResult.rows[0];
      const otpCreatedAt = new Date(user.otp_created_at).getTime();
      const now = Date.now();
      
      if (now - otpCreatedAt > AUTH_CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000) {
        return { success: false, message: 'OTP expired', isExistingUser: true, isNewUser: false, formCompleted: !!user.form_completed };
      }

      // 2. Call Provider to verify
      const provider = SMSServiceFactory.getSMSProvider();
      const isValid = await provider.verifyOTP(sanitizedPhone, otp);

      if (!isValid) {
        return { success: false, message: 'Invalid OTP code', isExistingUser: true, isNewUser: false, formCompleted: !!user.form_completed };
      }

      // 3. Success! Update User state
      const isNewUser = !!user.is_new_user;
      await pool.query(
        `UPDATE dev.users 
         SET otp_verified_at = CURRENT_TIMESTAMP, 
             otp_token = NULL,
             is_new_user = false,
             user_type = 'phone_verified'
         WHERE phone = $1`,
        [sanitizedPhone]
      );

      return {
        success: true,
        message: 'OTP verified successfully',
        isExistingUser: true,
        isNewUser: isNewUser,
        formCompleted: !!user.form_completed,
        userId: user.uid,
        sessionToken: 'jwt_placeholder' // Phase 4 will implement real JWTs
      };
    } catch (error) {
      console.error('phoneAuthService.verifyOTP Error:', error);
      return { success: false, message: 'Internal server error during verification', isExistingUser: false, isNewUser: false, formCompleted: false };
    }
  },

  async getOTPStatus(phone: string) {
    const provider = SMSServiceFactory.getSMSProvider();
    return provider.getOTPStatus(phone);
  },

  async cancelOTP(phone: string) {
    const provider = SMSServiceFactory.getSMSProvider();
    return provider.cancelOTP(phone);
  }
};
