import React from 'react';
import { useLogin } from '../hooks/useLogin';
import { Mail, Lock, User as UserIcon, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Login: React.FC = () => {
  const {
    isSignUp,
    setIsSignUp,
    email,
    setEmail,
    password,
    setPassword,
    displayName,
    setDisplayName,
    error,
    setError,
    success,
    setSuccess,
    loading,
    handleGoogleLogin,
    handleForgotPassword,
    handleEmailAuth
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
          <p className="text-[#5A5A40] font-serif italic">Your AI-Powered Loan Advisor</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 px-6 rounded-full hover:bg-gray-50 transition-all font-medium shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </>
            )}
          </button>

          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-sans uppercase tracking-widest text-gray-400 font-bold">Or use email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] mb-1 font-bold">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#5A5A40] transition-all"
                      placeholder="John Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] mb-1 font-bold">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#5A5A40] transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] mb-1 font-bold">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#5A5A40] transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-[#5A5A40] focus:ring-[#5A5A40]"
                  defaultChecked={localStorage.getItem('preferQuickLogin') === 'true'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      localStorage.setItem('preferQuickLogin', 'true');
                    } else {
                      localStorage.removeItem('preferQuickLogin');
                    }
                  }}
                />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-[#5A5A40] transition-colors">Remember Me</span>
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-[10px] font-bold text-[#5A5A40] hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[#5A5A40] border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-3 h-3" />
                      Forgot Password?
                    </>
                  )}
                </button>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded-lg">{error}</p>
            )}

            {success && (
              <p className="text-xs text-green-600 font-medium bg-green-50 p-2 rounded-lg">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] text-white py-4 rounded-full hover:bg-[#4A4A30] transition-all font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }}
              className="text-[#5A5A40] font-bold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-sans font-bold">Secure & Encrypted</p>
        </div>
      </motion.div>
    </div>
  );
};
