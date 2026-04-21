import React from 'react';
import { BankOffer, LoanApplication, UserProfile, ChatMessage } from '../../types';
import { AlertCircle, FileText } from 'lucide-react';
import { LoanCalculator } from '../LoanCalculator';

interface ActionRendererProps {
  action: ChatMessage['action'];
  profile: UserProfile;
  bankOffers: BankOffer[];
  userApplications: LoanApplication[];
  onApply: (offer: BankOffer) => void;
  onAskAI: (text: string) => void;
}

export const ActionRenderer: React.FC<ActionRendererProps> = ({ 
  action, profile, bankOffers, userApplications, onApply, onAskAI 
}) => {
  const matchedOffers = Array.from(new Set(action.data?.bankIds || []))
    .map((id: any) => bankOffers.find(o => 
      String(o.id) === String(id) || 
      o.bankName.toLowerCase() === String(id).toLowerCase() ||
      o.bankName.toLowerCase().includes(String(id).toLowerCase())
    ))
    .filter(Boolean) as BankOffer[];

  const activeApp = userApplications.find(app => app.status !== 'Approved' && app.status !== 'Rejected');

  if (!action || action.data?.hideCard || (matchedOffers.length === 0 && (action.type === 'COMPARE_OFFERS' || action.type === 'ELIGIBILITY_SUMMARY'))) return null;

  const calculateEMI = (p: number, r: number, n: number) => {
    const monthlyRate = r / 12 / 100;
    const emi = (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    return Math.round(emi);
  };

  const calculateMaxLoan = (monthlyIncome: number, existingEMIs: number, rate: number, tenure: number, bankMax: number) => {
    const foir = 0.5;
    const availableEMI = (monthlyIncome * foir) - existingEMIs;
    if (availableEMI <= 0) return 0;
    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) return bankMax;
    const maxLoan = availableEMI * ((1 - Math.pow(1 + monthlyRate, -tenure)) / monthlyRate);
    return Math.min(Math.round(maxLoan), bankMax);
  };

  switch (action.type) {
    case 'COMPARE_OFFERS':
    case 'ELIGIBILITY_SUMMARY':
      // The application now handles these actions by highlighting cards in the main dashboard's Marketplace.
      // We no longer render comparison tables inside the chat bubbles to keep the UI clean.
      return null;

    case 'CALCULATE_EMI':
      const calcAmount = action.data.requestedAmount || action.data.amount || profile.loanAmountRequired || 500000;
      const firstBank = matchedOffers[0];
      const calcTenure = action.data.requestedTenure ? action.data.requestedTenure * 12 : (action.data.tenure || (firstBank ? firstBank.maxTenure : 60));
      const calcRate = action.data.requestedRate || (firstBank ? firstBank.minInterestRate : 10.5);
      return (
        <div className="mt-4 flex justify-center">
          <LoanCalculator 
            initialAmount={calcAmount} initialRate={calcRate} initialTenure={calcTenure} bankName={firstBank?.bankName}
            onApply={(amt, rate, ten) => firstBank && onApply(firstBank)}
          />
        </div>
      );

    case 'CHECK_APPLICATION_STATUS':
      if (userApplications.length === 0) {
        return (
          <div className="mt-2 p-3 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> You don't have any active loan applications yet.
          </div>
        );
      }
      return (
        <div className="mt-2 space-y-2">
          {userApplications.map((app, i) => (
            <div key={`app-status-${app.id}-${i}`} className="bg-white p-4 rounded-3xl border border-[#5A5A40]/10 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-serif font-bold text-[#5A5A40]">{app.bankName}</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">{app.loanType}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  app.status === 'Approved' ? 'bg-green-100 text-green-700' :
                  app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                  app.status === 'Documents Received' ? 'bg-cyan-100 text-cyan-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {app.status}
                </span>
              </div>
              {app.subStatus && (
                <div className="mb-2 p-2 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-1">Latest Update</p>
                  <p className="text-xs font-bold text-blue-700">{app.subStatus}</p>
                </div>
              )}
              {app.statusNotes && <div className="text-xs text-gray-600 italic border-l-2 border-[#5A5A40]/20 pl-2 py-1">"{app.statusNotes}"</div>}
              {app.attachments && app.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">Submitted Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {app.attachments.map((att, idx) => (
                      <a key={`att-${att.fileUrl}-${idx}`} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span className="text-[10px] font-bold text-blue-700 truncate max-w-[100px]">{att.fileName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {app.status === 'Rejected' && app.rejectionReason && (
                <div className="mt-2">
                  <button onClick={() => onAskAI(`Why was my ${app.bankName} application rejected?`)} className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">
                    Ask AI for Rejection Reason
                  </button>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[10px] text-gray-400">Applied on {new Date(app.timestamp).toLocaleDateString()}</span>
                <span className="text-xs font-serif font-bold text-[#5A5A40]">₹{app.loanAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
};
