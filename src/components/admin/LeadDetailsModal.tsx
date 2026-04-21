import React from 'react';
import { motion } from 'motion/react';
import { 
  XCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit2, 
  FileText, 
  Download, 
  TrendingUp, 
  User as UserIcon 
} from 'lucide-react';
import { LoanApplication } from '../../types';

interface LeadDetailsModalProps {
  detailsModal: LoanApplication;
  setDetailsModal: (lead: LoanApplication | null) => void;
  detailsForm: any;
  setDetailsForm: (form: any) => void;
  leadHistory: any[];
  loadingHistory: boolean;
  updateLeadStatus: (id: string, status: string, reason?: string, subStatus?: string, notes?: string) => void;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  detailsModal,
  setDetailsModal,
  detailsForm,
  setDetailsForm,
  leadHistory,
  loadingHistory,
  updateLeadStatus
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[32px] p-0 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-[#5A5A40] p-6 text-white shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-serif font-bold">Application Details</h3>
              <p className="text-white/70 text-sm mt-1">
                Managing <span className="font-bold text-white">{detailsModal.userName}</span>'s application at <span className="font-bold text-white">{detailsModal.bankName}</span>
              </p>
            </div>
            <button 
              onClick={() => setDetailsModal(null)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-inner ${
              detailsModal.status === 'Approved' ? 'bg-green-400/20 text-green-100' :
              detailsModal.status === 'Rejected' ? 'bg-red-400/20 text-red-100' :
              'bg-white/20 text-white'
            }`}>
              {detailsModal.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> :
               detailsModal.status === 'Rejected' ? <XCircle className="w-3 h-3" /> :
               <Clock className="w-3 h-3" />}
              Current Status: {detailsModal.status}
            </div>
            {detailsModal.loanType && (
              <div className="px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest">
                {detailsModal.loanType}
              </div>
            )}
            <div className="px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest">
              ₹{detailsModal.loanAmount?.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
          {/* Rejection Reason Alert */}
          {detailsModal.status === 'Rejected' && detailsModal.rejectionReason && (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-4 items-start">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Rejection Reason</p>
                <p className="text-sm text-red-800 font-medium italic">"{detailsModal.rejectionReason}"</p>
              </div>
            </div>
          )}

          {/* Status Change Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 bg-[#F5F5F0] rounded-3xl border border-[#5A5A40]/10">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-4 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Update Status
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-1">Change Status</label>
                    <select 
                      className="w-full text-sm border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#5A5A40]/20 bg-white"
                      value={detailsForm.newStatus || detailsModal.status}
                      onChange={(e) => setDetailsForm({ ...detailsForm, newStatus: e.target.value as any })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Documents Received">Documents Received</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-1">
                      Internal Notes / Reason {detailsForm.newStatus && detailsForm.newStatus !== detailsModal.status && <span className="text-red-500">*</span>}
                    </label>
                    <textarea 
                      className="w-full text-sm border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#5A5A40]/20 h-32 resize-none bg-white"
                      placeholder={detailsForm.newStatus === 'Rejected' ? "Please provide the reason for rejection..." : "Add any internal notes or updates for the user..."}
                      value={detailsForm.statusNotes}
                      onChange={(e) => setDetailsForm({ ...detailsForm, statusNotes: e.target.value })}
                    />
                    {detailsForm.newStatus && detailsForm.newStatus !== detailsModal.status && !detailsForm.statusNotes.trim() && (
                      <p className="text-[9px] text-red-500 mt-1 italic">* Note is mandatory when changing status</p>
                    )}
                  </div>
                </div>
              </div>

              {detailsModal.attachments && detailsModal.attachments.length > 0 && (
                <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-100">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Received Documents
                  </h4>
                  <div className="space-y-2">
                    {detailsModal.attachments.map((att, i) => (
                      <a 
                        key={`attachment-${att.fileUrl}-${i}`} 
                        href={att.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white rounded-2xl border border-blue-100 hover:border-blue-300 transition-all group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-blue-900 truncate">{att.fileName}</p>
                            <p className="text-[8px] text-blue-500">{new Date(att.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-blue-400 group-hover:text-blue-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* History Timeline */}
            <div className="flex flex-col">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Update History
              </h4>
              <div className="relative flex-1">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-8 relative">
                  {loadingHistory ? (
                    <div className="flex items-center gap-4 pl-10">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
                      <p className="text-xs text-gray-400 italic">Loading history...</p>
                    </div>
                  ) : leadHistory.length === 0 ? (
                    <div className="flex items-center gap-4 pl-10">
                      <div className="w-2 h-2 bg-gray-300 rounded-full" />
                      <p className="text-xs text-gray-400 italic">No history available.</p>
                    </div>
                  ) : (
                    leadHistory.map((h, i) => (
                      <div key={`history-${h.id || h.created_at || i}`} className="relative pl-10">
                        <div className={`absolute left-3 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm -translate-x-1/2 mt-1.5 ${
                          h.status === 'Approved' ? 'bg-green-500' :
                          h.status === 'Rejected' ? 'bg-red-500' :
                          'bg-[#5A5A40]'
                        }`} />
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${
                              h.status === 'Approved' ? 'text-green-600' :
                              h.status === 'Rejected' ? 'text-red-600' :
                              'text-[#5A5A40]'
                            }`}>{h.status}</span>
                            <span className="text-[8px] text-gray-400">{new Date(h.created_at).toLocaleString()}</span>
                          </div>
                          {h.sub_status && <p className="text-xs font-bold text-blue-600 mb-1">{h.sub_status}</p>}
                          {h.status_notes && <p className="text-[11px] text-gray-500 italic mb-2">"{h.status_notes}"</p>}
                          {h.rejection_reason && (
                            <div className="p-2 bg-red-50 rounded-lg border border-red-100 mb-2">
                              <p className="text-[9px] font-bold text-red-700 uppercase tracking-widest mb-0.5">Rejection Reason</p>
                              <p className="text-[10px] text-red-800">{h.rejection_reason}</p>
                            </div>
                          )}
                          {h.staff_name && (
                            <div className="flex items-center gap-1 text-[8px] text-gray-400 mt-2 pt-2 border-t border-gray-50">
                              <UserIcon className="w-2 h-2" />
                              <span>Updated by: {h.staff_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 shrink-0">
          <button 
            onClick={() => setDetailsModal(null)}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold hover:bg-white transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              const finalStatus = detailsForm.newStatus || detailsModal.status;
              const finalReason = finalStatus === 'Rejected' ? detailsForm.statusNotes : (detailsModal.rejectionReason || '');
              updateLeadStatus(detailsModal.id, finalStatus, finalReason, detailsForm.subStatus, detailsForm.statusNotes);
            }}
            disabled={detailsForm.newStatus && detailsForm.newStatus !== detailsModal.status && !detailsForm.statusNotes.trim()}
            className="flex-1 py-3 rounded-2xl bg-[#5A5A40] text-white text-sm font-bold hover:bg-[#4A4A30] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Updates
          </button>
        </div>
      </motion.div>
    </div>
  );
};
