import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from './useAuth';

export function useLogin() {
  const { login: authLogin } = useAuth();
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-clear messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!phone) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);
    console.log(`[DEBUG] Attempting to send OTP to: ${phone}`);
    try {
      const result = await apiService.sendOTP(phone);
      console.log(`[DEBUG] apiService.sendOTP result:`, result);
      if (result.success) {
        setIsOtpSent(true);
        setSuccess('OTP sent successfully!');
      } else {
        console.warn(`[DEBUG] OTP send failed: ${result.message}`);
        setError(result.message);
      }
    } catch (err: any) {
      console.error('[DEBUG] CRITICAL network/fetch error in handleSendOTP:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!otpCode || otpCode.length < 4) {
      setError('Please enter a valid OTP code');
      return;
    }

    setLoading(true);
    setError(null);
    console.log(`[DEBUG] Attempting to verify OTP for ${phone} with code ${otpCode}`);
    try {
      const result = await apiService.verifyOTP(phone, otpCode);
      console.log(`[DEBUG] apiService.verifyOTP result:`, result);
      if (result.success && result.userId) {
        setSuccess('Login successful!');
        // Update global auth state
        await authLogin(result.userId, result.sessionToken || 'temp_token');
      } else {
        console.warn(`[DEBUG] Verification failed: ${result.message}`);
        setError(result.message);
      }
    } catch (err: any) {
      console.error('[DEBUG] CRITICAL network/fetch error in handleVerifyOTP:', err);
      setError('Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setIsOtpSent(false);
    setOtpCode('');
    setError(null);
    setSuccess(null);
  };

  return {
    phone,
    setPhone,
    otpCode,
    setOtpCode,
    isOtpSent,
    handleSendOTP,
    handleVerifyOTP,
    resetFlow,
    error,
    setError,
    success,
    setSuccess,
    loading
  };
}
