import React from 'react';
import { 
  UserPlus, 
  ShieldCheck, 
  Clock, 
  Trash2 
} from 'lucide-react';
import { UserProfile, StaffInvite } from '../../types';

interface StaffViewProps {
  users: UserProfile[];
  staffInvites: StaffInvite[];
  staffInviteData: any;
  setStaffInviteData: (data: any) => void;
  handleInviteStaff: (e: React.FormEvent) => void;
  updateUserRole: (uid: string, role: 'staff' | 'admin') => void;
  updateUserPermission: (uid: string, permission: string, value: boolean) => void;
  setDeleteConfirmation: (conf: any) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  users,
  staffInvites,
  staffInviteData,
  setStaffInviteData,
  handleInviteStaff,
  updateUserRole,
  updateUserPermission,
  setDeleteConfirmation
}) => {
  const activeStaff = users.filter(u => u.role === 'staff' || (u.role === 'admin' && u.email !== 'theskyaigiants@gmail.com'));
  const inputClass = "w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all font-sans";
  const labelClass = "block text-[10px] font-sans uppercase tracking-widest text-gray-400 font-bold mb-1 ml-1";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form onSubmit={handleInviteStaff} className="bg-white p-6 rounded-3xl shadow-lg border border-[#5A5A40]/10 sticky top-6">
            <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Hire New Staff
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="staff@company.com"
                  className={inputClass} 
                  value={staffInviteData.email} 
                  onChange={e => setStaffInviteData({ ...staffInviteData, email: e.target.value })} 
                />
              </div>
              <div>
                <label className={labelClass}>Initial Role</label>
                <select 
                  className={inputClass} 
                  value={staffInviteData.role} 
                  onChange={e => setStaffInviteData({ ...staffInviteData, role: e.target.value as any })}
                >
                  <option value="staff">Staff Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold mb-3">Permissions</h3>
                <div className="space-y-2">
                  <PermissionToggle 
                    label="Manage Banks" 
                    value={staffInviteData.permissions.canManageBanks} 
                    onChange={(v) => setStaffInviteData({ ...staffInviteData, permissions: { ...staffInviteData.permissions, canManageBanks: v } })} 
                  />
                  <PermissionToggle 
                    label="Manage Leads" 
                    value={staffInviteData.permissions.canManageLeads} 
                    onChange={(v) => setStaffInviteData({ ...staffInviteData, permissions: { ...staffInviteData.permissions, canManageLeads: v } })} 
                  />
                  <PermissionToggle 
                    label="Manage Users" 
                    value={staffInviteData.permissions.canManageUsers} 
                    onChange={(v) => setStaffInviteData({ ...staffInviteData, permissions: { ...staffInviteData.permissions, canManageUsers: v } })} 
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#5A5A40] text-white py-3 rounded-xl hover:bg-[#4A4A30] transition-all font-bold flex items-center justify-center gap-2 mt-4">
                <ShieldCheck className="w-5 h-5" /> Authorize Staff
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {staffInvites.length > 0 && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100">
              <h3 className="text-sm font-sans uppercase tracking-widest text-orange-600 font-bold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Pending Invitations
              </h3>
              <div className="space-y-3">
                {staffInvites.map((invite, idx) => (
                  <div key={`invite-${invite.id}-${idx}`} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                    <div>
                      <p className="font-bold text-sm">{invite.email}</p>
                      <p className="text-[10px] text-orange-600 uppercase tracking-widest">Role: {invite.role}</p>
                    </div>
                    <button onClick={() => setDeleteConfirmation({ id: invite.id, type: 'invite', name: invite.email })} className="p-2 text-red-600 hover:bg-red-100 rounded-full">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-lg font-serif font-bold">Active Staff Members</h3>
            </div>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#F5F5F0] text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold">
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Permissions</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {activeStaff.map((s, idx) => (
                  <tr key={`staff-${s.uid}-${idx}`} className="border-t border-gray-50">
                    <td className="p-4">
                      <p className="font-bold">{s.displayName || 'Staff Member'}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </td>
                    <td className="p-4">
                      <select 
                        className="bg-transparent border-b border-gray-100 font-bold text-xs outline-none"
                        value={s.role}
                        onChange={(e) => updateUserRole(s.uid, e.target.value as any)}
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <PermissionToggle 
                          label="Banks" 
                          value={s.permissions?.canManageBanks || false} 
                          onChange={(v) => updateUserPermission(s.uid, 'canManageBanks', v)} 
                        />
                        <PermissionToggle 
                          label="Leads" 
                          value={s.permissions?.canManageLeads || false} 
                          onChange={(v) => updateUserPermission(s.uid, 'canManageLeads', v)} 
                        />
                        <PermissionToggle 
                          label="Users" 
                          value={s.permissions?.canManageUsers || false} 
                          onChange={(v) => updateUserPermission(s.uid, 'canManageUsers', v)} 
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <button onClick={() => setDeleteConfirmation({ id: s.uid, type: 'staff', name: s.displayName || s.email })} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {activeStaff.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400 italic">No staff members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const PermissionToggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between group gap-4">
    <span className="text-[10px] text-gray-500 group-hover:text-[#5A5A40] transition-colors">{label}</span>
    <button 
      onClick={() => onChange(!value)}
      className={`w-8 h-4 rounded-full relative transition-all ${value ? 'bg-[#5A5A40]' : 'bg-gray-200'}`}
    >
      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${value ? 'left-4.5' : 'left-0.5'}`} />
    </button>
  </div>
);
