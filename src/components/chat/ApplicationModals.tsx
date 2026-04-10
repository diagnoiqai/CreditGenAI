import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BankOffer } from '../../types';

interface ApplicationModalsProps {
  showMobilePrompt: boolean;
  setShowMobilePrompt: (show: boolean) => void;
  mobileInput: string;
  setMobileInput: (val: string) => void;
  applyingFor: BankOffer | null;
  submittingApplication: boolean;
  onSubmitApplication: (mobile: string) => void;
  applicationMessage: string | null;
  setApplicationMessage: (msg: string | null) => void;
}

export const ApplicationModals: React.FC<ApplicationModalsProps> = ({
  showMobilePrompt, setShowMobilePrompt, mobileInput, setMobileInput,
  applyingFor, submittingApplication, onSubmitApplication,
  applicationMessage, setApplicationMessage
}) => {
  return (
    <AnimatePresence>
      {showMobilePrompt && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-[#F5F5F0] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#5A5A40]/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#5A5A40]/10 rounded-full flex items-center justify-center">
                <Sparkles className="text-[#5A5A40] w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif font-bold">Almost there!</h3>
            </div>
            <p className="text-[#5A5A40] font-serif italic mb-6">
              To process your application with **{applyingFor?.bankName}**, we need your mobile number to get in touch.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold mb-1 ml-1">Mobile Number</label>
                <input 
                  type="tel" value={mobileInput} onChange={(e) => setMobileInput(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full bg-white border border-[#5A5A40]/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowMobilePrompt(false)}
                  className="flex-1 px-4 py-3 border border-[#5A5A40]/20 rounded-2xl text-sm font-sans uppercase tracking-widest text-[#5A5A40] hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => onSubmitApplication(mobileInput)}
                  disabled={mobileInput.length < 10 || submittingApplication}
                  className="flex-1 px-4 py-3 bg-[#5A5A40] text-white rounded-2xl text-sm font-sans uppercase tracking-widest hover:bg-[#4A4A30] disabled:opacity-50 transition-all shadow-lg flex items-center justify-center"
                >
                  {submittingApplication ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {applicationMessage && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-[#F5F5F0] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#5A5A40]/20 text-center"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
              applicationMessage.includes('rejected') || applicationMessage.includes('Failed') ? 'bg-red-100' : 
              applicationMessage.includes('active application') ? 'bg-amber-100' : 'bg-green-100'
            }`}>
              {applicationMessage.includes('rejected') || applicationMessage.includes('Failed') ? <AlertCircle className="text-red-600 w-8 h-8" /> : 
               applicationMessage.includes('active application') ? <AlertCircle className="text-amber-600 w-8 h-8" /> :
               <CheckCircle2 className="text-green-600 w-8 h-8" />}
            </div>
            <h3 className="text-2xl font-serif font-bold mb-4">
              {applicationMessage.includes('rejected') || applicationMessage.includes('Failed') ? 'Application Update' : 
               applicationMessage.includes('active application') ? 'Active Application Found' :
               'Application Received!'}
            </h3>
            <p className="text-[#5A5A40] font-serif italic mb-8">{applicationMessage}</p>
            <button 
              onClick={() => setApplicationMessage(null)}
              className={`w-full px-4 py-3 text-white rounded-2xl text-sm font-sans uppercase tracking-widest transition-all shadow-lg ${
                applicationMessage.includes('rejected') || applicationMessage.includes('Failed') ? 'bg-red-600 hover:bg-red-700' : 
                applicationMessage.includes('active application') ? 'bg-amber-700 hover:bg-amber-800' :
                'bg-[#5A5A40] hover:bg-[#4A4A30]'
              }`}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
