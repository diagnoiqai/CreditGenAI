import React from 'react';
import { X } from 'lucide-react';
import { UserProfile } from '../../types';

interface UserEditModalProps {
  editingUser: UserProfile;
  setEditingUser: (user: UserProfile | null) => void;
  handleUpdateUser: (e: React.FormEvent) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  editingUser,
  setEditingUser,
  handleUpdateUser
}) => {
  const inputClass = "w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all font-sans";
  const labelClass = "block text-[10px] font-sans uppercase tracking-widest text-gray-400 font-bold mb-1 ml-1";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-2xl w-full border border-[#5A5A40]/10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Edit Loan Seeker Data</h3>
          <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleUpdateUser} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" className={inputClass} value={editingUser.displayName || ''} onChange={e => setEditingUser({ ...editingUser, displayName: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Mobile Number</label>
              <input type="tel" className={inputClass} value={editingUser.phone || ''} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Monthly Income (₹)</label>
              <input type="number" className={inputClass} value={editingUser.monthlyIncome || ''} onChange={e => setEditingUser({ ...editingUser, monthlyIncome: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Existing EMIs (₹)</label>
              <input type="number" className={inputClass} value={editingUser.existingEMIs || ''} onChange={e => setEditingUser({ ...editingUser, existingEMIs: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>CIBIL Score</label>
              <input type="number" className={inputClass} value={editingUser.cibilScore || ''} onChange={e => setEditingUser({ ...editingUser, cibilScore: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Employment Type</label>
              <select className={inputClass} value={editingUser.employmentType} onChange={e => setEditingUser({ ...editingUser, employmentType: e.target.value as any })}>
                <option value="Salaried">Salaried</option>
                <option value="Self-employed">Self-employed</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-[#5A5A40] text-white py-4 rounded-full font-bold text-lg hover:bg-[#4A4A30] transition-all shadow-lg">
            Update Profile Data
          </button>
        </form>
      </div>
    </div>
  );
};
