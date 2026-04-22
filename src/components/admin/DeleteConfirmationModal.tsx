import React from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  deleteConfirmation: { id: string; type: 'bank' | 'invite' | 'staff'; name: string };
  setDeleteConfirmation: (conf: any) => void;
  handleDeleteOffer: (id: string) => void;
  handleRemoveInvite: (id: string) => void;
  handleRemoveStaff: (id: string) => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  deleteConfirmation,
  setDeleteConfirmation,
  handleDeleteOffer,
  handleRemoveInvite,
  handleRemoveStaff
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-serif font-bold mb-2">Are you sure?</h3>
          <p className="text-[#5A5A40] mb-8">
            You are about to delete <span className="font-bold text-black">{deleteConfirmation.name}</span>. 
            {deleteConfirmation.type === 'staff' ? ' This staff member will be demoted to a regular user.' : ' This action cannot be undone.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirmation(null)}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (deleteConfirmation.type === 'bank') handleDeleteOffer(deleteConfirmation.id);
                else if (deleteConfirmation.type === 'invite') handleRemoveInvite(deleteConfirmation.id);
                else if (deleteConfirmation.type === 'staff') handleRemoveStaff(deleteConfirmation.id);
              }}
              className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
