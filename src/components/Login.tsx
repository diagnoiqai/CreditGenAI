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
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[32px] shadow-xl max-w-md w-full border border-[#5A5A40]/10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#5A5A40] rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-[#1a1a1a] mb-2">CreditGenAI</h1>
          <p className="text-[#5A5A40] font-serif italic text-sm">Verify your identity via secure OTP</p>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!isOtpSent ? (
              <motion.div
                key="phone-input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="block text-[10px] font-sans uppercase tracking-[0.2em] text-[#5A5A40] font-bold">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A080]" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#F5F5F0] border-0 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all text-lg font-medium"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 italic">We'll send a one-time password to this number.</p>
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={loading || !phone}
                  className="w-full bg-[#5A5A40] text-white py-4 rounded-full hover:bg-[#4A4A30] transition-all font-bold text-lg shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                className="space-y-6"
              >
                <button 
                  onClick={resetFlow}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest hover:underline"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Change Phone Number
                </button>

                <div className="space-y-2">
                  <label className="block text-[10px] font-sans uppercase tracking-[0.2em] text-[#5A5A40] font-bold">
                    Enter 6-Digit Code
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A080]" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="••••••"
                      className="w-full bg-[#F5F5F0] border-0 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all text-2xl font-mono tracking-[0.5em] text-center"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <p className="text-center text-[11px] text-[#5A5A40]">
                    OTP sent to <span className="font-bold">{phone}</span>
                  </p>
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otpCode.length < 4}
                  className="w-full bg-[#5A5A40] text-white py-4 rounded-full hover:bg-[#4A4A30] transition-all font-bold text-lg shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify & Continue
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button 
                    onClick={handleSendOTP}
                    className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest hover:underline disabled:opacity-50"
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
                className="text-xs text-red-500 font-medium bg-red-50 p-3 rounded-xl border border-red-100 text-center"
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-green-600 font-medium bg-green-50 p-3 rounded-xl border border-green-100 text-center"
              >
                {success}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-sans font-bold">Secure OTP Authentication</p>
        </div>
      </motion.div>
    </div>
  );
};
