import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { LogIn, Mail, Lock, User as UserIcon, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getFriendlyErrorMessage = (error: any) => {
    const code = error.code;
    switch (code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Login was cancelled. Please try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return error.message?.replace('Firebase: ', '') || 'An unexpected error occurred. Please try again.';
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setSuccess(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error));
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

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
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 px-6 rounded-full hover:bg-gray-50 transition-all font-medium shadow-sm active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
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
                  className="text-[10px] font-bold text-[#5A5A40] hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Forgot Password?
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
              className="w-full bg-[#5A5A40] text-white py-4 rounded-full hover:bg-[#4A4A30] transition-all font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              onClick={() => setIsSignUp(!isSignUp)}
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
