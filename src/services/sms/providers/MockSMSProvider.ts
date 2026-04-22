import { ISMSProvider } from '../ISMSProvider';
import { OTPResponse, OTPStatus } from '../../../types';

/**
 * Mock SMS Provider for local development
 * Code '123456' always works.
 */
export class MockSMSProvider implements ISMSProvider {
  async sendOTP(phone: string): Promise<OTPResponse> {
    console.log(`[MOCK SMS] Sending OTP to ${phone}. Code: 123456`);
    return {
      success: true,
      message: 'Mock OTP sent (Code: 123456)',
      referenceId: 'mock-ref-' + Date.now(),
    };
  }

  async verifyOTP(phone: string, otp: string): Promise<boolean> {
    console.log(`[MOCK SMS] Verifying OTP ${otp} for ${phone}`);
    return otp === '123456';
  }

  async getOTPStatus(phone: string): Promise<OTPStatus> {
    return { status: 'pending', phone, attempts: 1 };
  }

  async cancelOTP(phone: string): Promise<void> {
    console.log(`[MOCK SMS] Canceled OTP for ${phone}`);
  }
}
