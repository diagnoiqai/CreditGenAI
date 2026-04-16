import React from 'react';
import { 
  Filter, 
  Search, 
  FileText, 
  Edit2 
} from 'lucide-react';
import { LoanApplication, UserProfile } from '../../types';

interface LeadsViewProps {
  leads: LoanApplication[];
  users: UserProfile[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userLeadsFilter: string | null;
  setUserLeadsFilter: (uid: string | null) => void;
  leadsStatusFilter: string | null;
  setLeadsStatusFilter: (status: string | null) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  isWithinRange: (date: string | undefined) => boolean;
  setDetailsModal: (lead: LoanApplication) => void;
  setDetailsForm: (form: any) => void;
  setRejectionModal: (modal: any) => void;
  fetchHistory: (id: string) => void;
  // Pagination props
  leadsPage: number;
  leadsPagination: { totalCount: number; totalPages: number; page: number; pageSize: number };
  nextLeadsPage: () => void;
  prevLeadsPage: () => void;
  goToLeadsPage: (page: number) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  users,
  searchQuery,
  setSearchQuery,
  userLeadsFilter,
  setUserLeadsFilter,
  leadsStatusFilter,
  setLeadsStatusFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isWithinRange,
  setDetailsModal,
  setDetailsForm,
  setRejectionModal,
  fetchHistory,
  leadsPage,
  leadsPagination,
  nextLeadsPage,
  prevLeadsPage,
  goToLeadsPage
}) => {
  const inputClass = "w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all font-sans";

  const filteredLeads = leads.filter(l => {
    const matchesSearch = (l.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (l.bankName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUser = userLeadsFilter ? l.uid === userLeadsFilter : true;
    const matchesStatus = leadsStatusFilter ? l.status === leadsStatusFilter : true;
    const matchesDate = (startDate && endDate) ? isWithinRange(l.timestamp) : true;
    return matchesSearch && matchesUser && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-serif font-bold">Loan Applications (Leads)</h2>
          {(userLeadsFilter || leadsStatusFilter || (startDate && endDate)) && (
            <div className="flex items-center gap-4 text-xs text-[#5A5A40] font-bold">
              {userLeadsFilter && (
                <div className="flex items-center gap-2">
                  <span>User: {users.find(u => u.uid === userLeadsFilter)?.displayName || leads.find(l => l.uid === userLeadsFilter)?.userName || userLeadsFilter}</span>
                  <button onClick={() => setUserLeadsFilter(null)} className="text-red-500 hover:underline">Clear</button>
                </div>
              )}
              {leadsStatusFilter && (
                <div className="flex items-center gap-2">
                  <span>Status: {leadsStatusFilter}</span>
                  <button onClick={() => setLeadsStatusFilter(null)} className="text-red-500 hover:underline">Clear</button>
                </div>
              )}
              {(startDate && endDate) && (
                <div className="flex items-center gap-2">
                  <span>Range: {startDate} to {endDate}</span>
                  <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-red-500 hover:underline">Clear</button>
                </div>
              )}
              <button 
                onClick={() => { setUserLeadsFilter(null); setLeadsStatusFilter(null); setStartDate(''); setEndDate(''); }} 
                className="bg-red-50 text-red-600 px-2 py-0.5 rounded hover:bg-red-100"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
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
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search leads..." 
              className={inputClass + " pl-10"} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#F5F5F0] text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold">
              <th className="p-4">User</th>
              <th className="p-4">Bank & Loan</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-12 h-12 opacity-20" />
                    <p className="font-serif italic">No loan applications found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead, idx) => (
              <tr key={`${lead.id}-${idx}`} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <p className="font-bold">{lead.userName || 'N/A'}</p>
                  <p className="text-xs text-gray-400">{lead.userEmail || 'N/A'}</p>
                  <p className="text-xs text-gray-400">{lead.userMobile || 'N/A'}</p>
                </td>
                <td className="p-4">
                  <p className="font-bold">{lead.bankName}</p>
                  <p className="text-xs text-[#5A5A40]">{lead.loanType}</p>
                </td>
                <td className="p-4 font-serif font-bold">₹{lead.loanAmount?.toLocaleString('en-IN') || 0}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    lead.status === 'Approved' ? 'bg-green-100 text-green-700' :
                    lead.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                    lead.status === 'Contacted' ? 'bg-blue-100 text-blue-700' :
                    lead.status === 'Interested' ? 'bg-purple-100 text-purple-700' :
                    lead.status === 'Documents Received' ? 'bg-cyan-100 text-cyan-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {lead.status}
                  </span>
                  {lead.subStatus && (
                    <p className="text-[10px] text-blue-600 mt-1 font-bold">{lead.subStatus}</p>
                  )}
                  {lead.attachments && lead.attachments.length > 0 && (
                    <div className="flex items-center gap-1 text-blue-600 mt-1">
                      <FileText className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{lead.attachments.length} Docs</span>
                    </div>
                  )}
                </td>
                <td className="p-4 text-xs text-gray-400">{lead.timestamp ? new Date(lead.timestamp).toLocaleDateString() : 'N/A'}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <select 
                      className="text-xs border border-gray-200 rounded p-1 outline-none"
                      value={lead.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as any;
                        if (newStatus === 'Rejected') {
                          setRejectionModal({ id: lead.id, reason: '' });
                        } else if (newStatus !== lead.status) {
                          setDetailsModal(lead);
                          setDetailsForm({ 
                            subStatus: lead.subStatus || '', 
                            statusNotes: '', 
                            newStatus: newStatus 
                          });
                          fetchHistory(lead.id);
                        }
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Documents Received">Documents Received</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <button 
                      onClick={() => {
                        setDetailsModal(lead);
                        setDetailsForm({ 
                          subStatus: lead.subStatus || '', 
                          statusNotes: lead.statusNotes || '',
                          newStatus: undefined
                        });
                        fetchHistory(lead.id);
                      }}
                      className="p-1 text-[#5A5A40] hover:bg-[#F5F5F0] rounded"
                      title="Update Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
        {leadsPagination.totalCount > 0 && (
          <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50">
            <div className="text-xs text-gray-600 font-medium">
              Showing <span className="font-bold">{(leadsPage - 1) * leadsPagination.pageSize + 1}</span> to <span className="font-bold">{Math.min(leadsPage * leadsPagination.pageSize, leadsPagination.totalCount)}</span> of <span className="font-bold">{leadsPagination.totalCount}</span> leads
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={prevLeadsPage}
                disabled={leadsPage === 1}
                className="px-3 py-2 text-sm font-semibold text-[#5A5A40] bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                ← Previous
              </button>
              <div className="px-4 py-2 text-sm font-bold text-[#5A5A40] bg-white border border-gray-200 rounded-lg">
                Page {leadsPage} of {leadsPagination.totalPages}
              </div>
              <button 
                onClick={nextLeadsPage}
                disabled={leadsPage >= leadsPagination.totalPages}
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
