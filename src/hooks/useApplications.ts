import { useState, useEffect, useCallback } from 'react';
import { UserProfile, BankOffer, LoanApplication, ChatMessage } from '../types';
import { apiService } from '../services/apiService';

export const useApplications = (profile: UserProfile, onAddMessage: (msg: ChatMessage) => void) => {
  const [userApplications, setUserApplications] = useState<LoanApplication[]>([]);
  const [applyingFor, setApplyingFor] = useState<BankOffer | null>(null);
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [mobileInput, setMobileInput] = useState(profile.phone || '');
  const [applicationMessage, setApplicationMessage] = useState<string | null>(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);

  const fetchApps = useCallback(async () => {
    if (profile.uid) {
      const apps = await apiService.getApplications(profile.uid);
      setUserApplications(apps);
    }
  }, [profile.uid]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const submitApplication = async (mobile: string, offer?: BankOffer) => {
    const targetOffer = offer || applyingFor;
    if (!mobile || mobile.length < 10 || !targetOffer || submittingApplication) return;
    setSubmittingApplication(true);
    try {
      const updatedProfile = { ...profile, phone: mobile };
      if (!profile.phone) {
        await apiService.saveUserProfile(updatedProfile);
      }

      const result = await apiService.applyForLoan(updatedProfile, targetOffer);
      
      if (result.success) {
        setApplicationMessage(result.message || "Application received! One of our executive will get back to you for further process.");
        fetchApps();
      } else {
        setApplicationMessage(result.message || "Failed to submit application. Please try again later.");
      }
      
      setShowMobilePrompt(false);
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handleApply = (offer: BankOffer) => {
    const activeApp = userApplications.find(app => 
      app.status === 'Pending' || 
      app.status === 'Contacted' || 
      app.status === 'Interested' || 
      app.status === 'Documents Received'
    );
    
    if (activeApp) {
      const msg = `You already have an active application with ${activeApp.bankName} (Status: ${activeApp.status}). \n\nYou can only apply to one bank at a time. Please wait until your current application is Approved or Rejected before applying to another bank.`;
      
      const botMsg: ChatMessage = {
        role: 'assistant',
        content: msg,
        timestamp: new Date().toISOString()
      };
      onAddMessage(botMsg);
      setApplicationMessage(msg);
      
      // Ensure UI scrolls to the new message
      setTimeout(() => {
        const chatContainer = document.querySelector('.overflow-y-auto');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
      
      return;
    }

    setApplyingFor(offer);
    if (!profile.phone) {
      setShowMobilePrompt(true);
    } else {
      submitApplication(profile.phone, offer);
    }
  };

  return {
    userApplications,
    applyingFor,
    showMobilePrompt,
    setShowMobilePrompt,
    mobileInput,
    setMobileInput,
    applicationMessage,
    setApplicationMessage,
    submittingApplication,
    handleApply,
    submitApplication
  };
};
