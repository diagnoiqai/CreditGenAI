import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { apiService } from '../services/apiService';

export function useLogin() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
      setLoading(true);
      setError(null);
      setSuccess(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
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
    
    // Validate displayName for signup
    if (isSignUp && !displayName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        
        // Save user profile to PostgreSQL database
        const profileSaved = await apiService.saveUserProfile({
          uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          displayName: displayName.trim(),
          monthlyIncome: 0,
          employmentType: 'Salaried',
          companyType: 'Other',
          companyName: '',
          workExperience: '',
          totalExperience: '',
          city: '',
          existingEMIs: 0,
          age: 25,
          gender: 'Male',
          maritalStatus: 'Single',
          cibilScore: 750,
          loanAmountRequired: 0,
          loanType: 'Personal Loan'
        });
        
        if (!profileSaved) {
          console.warn('Failed to save profile to database, but Firebase auth succeeded');
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
