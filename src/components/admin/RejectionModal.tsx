import React from 'react';
import { motion } from 'motion/react';
import { XCircle, AlertCircle } from 'lucide-react';

interface RejectionModalProps {
  rejectionModal: { id: string; reason: string };
  setRejectionModal: (modal: any) => void;
  updateLeadStatus: (id: string, status: string, reason?: string) => void;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
  rejectionModal,
  setRejectionModal,
  updateLeadStatus
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-6 bg-red-600 text-white flex justify-between items-center">
          <h3 className="text-xl font-serif font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Reject Application
          </h3>
          <button onClick={() => setRejectionModal(null)} className="p-1 hover:bg-white/10 rounded-full">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-8">
          <p className="text-sm text-gray-500 mb-4">Please provide a clear reason for rejecting this loan application. This will be visible to the user.</p>
          <textarea
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-red-500/20 outline-none transition-all h-32 resize-none"
            placeholder="e.g. Low CIBIL score, insufficient income documentation..."
            value={rejectionModal.reason}
            onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
          />
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setRejectionModal(null)}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => updateLeadStatus(rejectionModal.id, 'Rejected', rejectionModal.reason)}
              disabled={!rejectionModal.reason.trim()}
              className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
