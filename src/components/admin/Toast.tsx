import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  toast: { message: string; type: 'success' | 'error' } | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className={`fixed bottom-[calc(2rem+var(--safe-bottom))] right-4 md:right-8 max-w-[calc(100vw-2rem-var(--safe-left)-var(--safe-right))] px-6 py-4 rounded-2xl shadow-2xl z-[1000] flex items-center gap-3 text-white font-bold ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
