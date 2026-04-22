import React from 'react';
import { useLogin } from '../hooks/useLogin';
import { Phone, ArrowRight, Sparkles, MessageSquare, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Login: React.FC = () => {
  const {
    phone,
    setPhone,
    otpCode,
    setOtpCode,
    isOtpSent,
    handleSendOTP,
    handleVerifyOTP,
    resetFlow,
    error,
    success,
    loading
  } = useLogin();

  return (
    <div className="min-h-app bg-[#F2F5FB] flex flex-col items-center justify-center p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full border border-[#E4EAF4]"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#1B6EF3] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
            <Sparkles className="text-white w-7 h-7" />
          </div>
          <h1 className="text-3xl font-display font-bold text-[#0D1626] mb-2">CreditGenAI</h1>
          <p className="text-[#4A5878] font-medium text-sm">Secure login with OTP verification</p>
        </div>

        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {!isOtpSent ? (
              <motion.div
                key="phone-input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="block text-xs font-sans uppercase tracking-wide font-semibold text-[#0D1626]">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E9BB8]" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#F7F9FD] border border-[#E4EAF4] rounded-lg py-3 pl-11 pr-4 outline-none focus:border-[#1B6EF3] focus:ring-2 focus:ring-[#EBF2FF] transition-all text-base font-medium text-[#0D1626]"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-[#8E9BB8]">We'll send a one-time password to this number.</p>
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={loading || !phone}
                  className="w-full bg-[#1B6EF3] text-white py-3 rounded-lg hover:bg-[#0F57D8] transition-all font-semibold text-base shadow-md flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="otp-input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <button 
                  onClick={resetFlow}
                  className="flex items-center gap-1 text-xs font-semibold text-[#1B6EF3] uppercase tracking-wide hover:text-[#0F57D8] transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Change Phone Number
                </button>

                <div className="space-y-2">
                  <label className="block text-xs font-sans uppercase tracking-wide font-semibold text-[#0D1626]">
                    Enter 6-Digit Code
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E9BB8]" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="••••••"
                      className="w-full bg-[#F7F9FD] border border-[#E4EAF4] rounded-lg py-3 pl-11 pr-4 outline-none focus:border-[#1B6EF3] focus:ring-2 focus:ring-[#EBF2FF] transition-all text-2xl font-mono tracking-[0.5em] text-center text-[#0D1626]"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <p className="text-center text-xs text-[#4A5878]">
                    OTP sent to <span className="font-semibold">{phone}</span>
                  </p>
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otpCode.length < 4}
                  className="w-full bg-[#1B6EF3] text-white py-3 rounded-lg hover:bg-[#0F57D8] transition-all font-semibold text-base shadow-md flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify & Continue
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button 
                    onClick={handleSendOTP}
                    className="text-xs font-semibold text-[#1B6EF3] uppercase tracking-wide hover:text-[#0F57D8] disabled:opacity-50 transition-colors"
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-[#DC2626] font-semibold bg-[#FEE2E2] p-3 rounded-lg border border-[#FEE2E2] text-center"
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-[#006F47] font-semibold bg-[#E6F9F3] p-3 rounded-lg border border-[#E6F9F3] text-center"
              >
                {success}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E4EAF4] text-center">
          <p className="text-xs text-[#8E9BB8] uppercase tracking-wide font-semibold">Bank-grade encryption</p>
        </div>
      </motion.div>
    </div>
  );
};
