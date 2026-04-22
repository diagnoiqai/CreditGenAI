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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))]"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#E4EAF4]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#EBF2FF] rounded-xl flex items-center justify-center">
                <Sparkles className="text-[#1B6EF3] w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold text-[#0D1626]">Almost there!</h3>
            </div>
            <p className="text-[#4A5878] font-medium mb-6 text-sm">
              To process your application with <span className="text-[#0D1626] font-bold">{applyingFor?.bankName}</span>, we need your mobile number to get in touch.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8E9BB8] mb-1.5 ml-1">Mobile Number</label>
                <input 
                  type="tel" value={mobileInput} onChange={(e) => setMobileInput(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full bg-[#F7F9FD] border border-[#E4EAF4] rounded-xl px-4 py-3 text-sm font-semibold text-[#0D1626] focus:outline-none focus:ring-2 focus:ring-[#1B6EF3]/20 focus:border-[#1B6EF3] transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowMobilePrompt(false)}
                  className="flex-1 px-4 py-3 border border-[#E4EAF4] rounded-xl text-xs font-bold uppercase tracking-wider text-[#4A5878] hover:bg-[#F7F9FD] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => onSubmitApplication(mobileInput)}
                  disabled={mobileInput.length < 10 || submittingApplication}
                  className="flex-1 px-4 py-3 bg-[#1B6EF3] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#0F57D8] disabled:opacity-50 transition-all shadow-md flex items-center justify-center"
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))]"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#E4EAF4] text-center"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
              applicationMessage.includes('rejected') || applicationMessage.includes('Failed') ? 'bg-red-50' : 
              applicationMessage.includes('active application') ? 'bg-amber-50' : 'bg-green-50'
            }`}>
              {applicationMessage.includes('rejected') || applicationMessage.includes('Failed') ? <CheckCircle2 className="text-red-500 w-8 h-8" /> : 
               applicationMessage.includes('active application') ? <AlertCircle className="text-amber-500 w-8 h-8" /> :
               <CheckCircle2 className="text-green-500 w-8 h-8" />}
            </div>
            <h3 className="text-2xl font-display font-bold mb-2 text-[#0D1626]">
              {applicationMessage.includes('rejected') || applicationMessage.includes('Failed') ? 'Update' : 
               applicationMessage.includes('active application') ? 'Pending Application' :
               'Success!'}
            </h3>
            <p className="text-[#4A5878] font-medium mb-8 text-sm">{applicationMessage}</p>
            <button 
              onClick={() => setApplicationMessage(null)}
              className={`w-full px-4 py-4 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${
                applicationMessage.includes('rejected') || applicationMessage.includes('Failed') ? 'bg-red-600 hover:bg-red-700' : 
                applicationMessage.includes('active application') ? 'bg-amber-600 hover:bg-amber-700' :
                'bg-[#1B6EF3] hover:bg-[#0F57D8]'
              }`}
            >
              Okay
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
