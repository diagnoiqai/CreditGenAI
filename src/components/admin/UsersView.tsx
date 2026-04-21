import React from 'react';
import { 
  Filter, 
  Search, 
  Users, 
  Edit2 
} from 'lucide-react';
import { UserProfile } from '../../types';
import { AdminView } from '../../hooks/useAdmin';

interface UsersViewProps {
  users: UserProfile[];
  staffInvites: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  isWithinRange: (date: string | undefined) => boolean;
  setEditingUser: (user: UserProfile) => void;
  setUserLeadsFilter: (uid: string) => void;
  setActiveView: (view: AdminView) => void;
  // Pagination props
  usersPage: number;
  usersPagination: { totalCount: number; totalPages: number; page: number; pageSize: number };
  nextUsersPage: () => void;
  prevUsersPage: () => void;
  goToUsersPage: (page: number) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  staffInvites,
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isWithinRange,
  setEditingUser,
  setUserLeadsFilter,
  setActiveView,
  usersPage,
  usersPagination,
  nextUsersPage,
  prevUsersPage,
  goToUsersPage
}) => {
  const inputClass = "w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all font-sans";

  const loanSeekers = users.filter(u => 
    (u.role === 'user' || !u.role) && 
    u.email !== 'theskyaigiants@gmail.com' &&
    !staffInvites.some(i => i.email === u.email)
  ).filter(u => {
    const matchesSearch = (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = (startDate && endDate) ? isWithinRange(u.createdAt) : true;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-serif font-bold">Loan Seekers</h2>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            <Filter className="w-4 h-4 text-[#5A5A40]" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">From:</span>
              <input 
                type="date" 
                className="text-xs border-none outline-none focus:ring-0 bg-transparent"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">To:</span>
              <input 
                type="date" 
                className="text-xs border-none outline-none focus:ring-0 bg-transparent"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Search users..." 
              className={inputClass} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#F5F5F0] text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold">
              <th className="p-4">User Details</th>
              <th className="p-4">Financials</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">Last Seen</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loanSeekers.map((u, idx) => {
              const tenMinsAgo = new Date(Date.now() - 600000).toISOString();
              const isOnline = u.lastSeen && u.lastSeen > tenMinsAgo;
              
              return (
                <tr key={`user-${u.uid}-${idx}`} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40]">
                          <Users className="w-4 h-4" />
                        </div>
                        {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />}
                      </div>
                      <div>
                        <p className="font-bold">{u.displayName || 'Unnamed User'}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold">₹{u.monthlyIncome?.toLocaleString('en-IN') || 0}</p>
                    <p className={`text-xs ${u.cibilScore && u.cibilScore >= 750 ? 'text-green-600' : 'text-orange-600'}`}>
                      CIBIL: {u.cibilScore || 'N/A'}
                    </p>
                  </td>
                  <td className="p-4 text-xs font-mono">{u.phone || 'N/A'}</td>
                  <td className="p-4 text-xs text-gray-400">
                    {u.lastSeen ? new Date(u.lastSeen).toLocaleString() : 'Never'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingUser(u)}
                        className="p-1 text-[#5A5A40] hover:bg-[#F5F5F0] rounded transition-colors"
                        title="Edit User Data"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setUserLeadsFilter(u.uid);
                          setActiveView('leads');
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] hover:underline"
                      >
                        View Leads
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {usersPagination.totalCount > 0 && (
          <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50">
            <div className="text-xs text-gray-600 font-medium">
              Showing <span className="font-bold">{(usersPage - 1) * usersPagination.pageSize + 1}</span> to <span className="font-bold">{Math.min(usersPage * usersPagination.pageSize, usersPagination.totalCount)}</span> of <span className="font-bold">{usersPagination.totalCount}</span> users
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={prevUsersPage}
                disabled={usersPage === 1}
                className="px-3 py-2 text-sm font-semibold text-[#5A5A40] bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                ← Previous
              </button>
              <div className="px-4 py-2 text-sm font-bold text-[#5A5A40] bg-white border border-gray-200 rounded-lg">
                Page {usersPage} of {usersPagination.totalPages}
              </div>
              <button 
                onClick={nextUsersPage}
                disabled={usersPage >= usersPagination.totalPages}
                className="px-3 py-2 text-sm font-semibold text-[#5A5A40] bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
