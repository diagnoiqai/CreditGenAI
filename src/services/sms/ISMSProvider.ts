import { OTPResponse, OTPStatus } from '../../types';

/**
 * Interface for SMS/OTP Providers
 * 
 * Any new SMS service (Exotel, Twilio, AWS SNS) must implement this contract.
 */
export interface ISMSProvider {
  /**
   * Sends an OTP to the specified phone number
   * @param phone The recipient's phone number
   * @returns OTPResponse indicating success and a reference ID
   */
  sendOTP(phone: string): Promise<OTPResponse>;

  /**
   * Verifies an OTP code for a phone number
   * @param phone The recipient's phone number
   * @param otp The 6-digit OTP code to verify
   * @returns Boolean indicating if verification succeeded
   */
  verifyOTP(phone: string, otp: string): Promise<boolean>;

  /**
   * Gets the delivery status of an OTP request
   * @param phone The recipient's phone number
   * @returns Current status of the OTP
   */
  getOTPStatus(phone: string): Promise<OTPStatus>;

  /**
   * Cancels a pending OTP request
   * @param phone The recipient's phone number
   */
  cancelOTP(phone: string): Promise<void>;
}
