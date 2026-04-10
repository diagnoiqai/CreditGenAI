import React from 'react';
import { 
  Building2, 
  Save, 
  X, 
  Download, 
  Upload, 
  Search, 
  Edit2, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { BankOffer } from '../../types';

interface BanksViewProps {
  offers: BankOffer[];
  canManageBanks: boolean;
  formData: Partial<BankOffer>;
  setFormData: (data: Partial<BankOffer>) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  handleSaveOffer: (e: React.FormEvent) => void;
  handleDeleteOffer: (id: string) => void;
  exportBanksToExcel: () => void;
  importBanksFromExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRefreshing: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setDeleteConfirmation: (conf: any) => void;
}

export const BanksView: React.FC<BanksViewProps> = ({
  offers,
  canManageBanks,
  formData,
  setFormData,
  editingId,
  setEditingId,
  handleSaveOffer,
  handleDeleteOffer,
  exportBanksToExcel,
  importBanksFromExcel,
  isRefreshing,
  searchQuery,
  setSearchQuery,
  setDeleteConfirmation
}) => {
  const inputClass = "w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all font-sans";
  const labelClass = "block text-[10px] font-sans uppercase tracking-widest text-gray-400 font-bold mb-1 ml-1";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {canManageBanks && (
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <form onSubmit={handleSaveOffer} className="bg-white p-6 rounded-3xl shadow-lg border border-[#5A5A40]/10">
              <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {editingId ? 'Edit Bank Offer' : 'Add New Bank'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Bank Name</label>
                  <input type="text" required className={inputClass} value={formData.bankName || ''} onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Loan Type</label>
                  <select className={inputClass} value={formData.loanType} onChange={e => setFormData({ ...formData, loanType: e.target.value as any })}>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Home Loan">Home Loan</option>
                    <option value="Car Loan">Car Loan</option>
                    <option value="Business Loan">Business Loan</option>
                    <option value="Jewelry Loan">Jewelry Loan</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Min Amount (₹)</label>
                    <input type="number" required className={inputClass} value={formData.minAmount || ''} onChange={e => setFormData({ ...formData, minAmount: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={labelClass}>Max Amount (₹)</label>
                    <input type="number" required className={inputClass} value={formData.maxAmount || ''} onChange={e => setFormData({ ...formData, maxAmount: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Min Interest (%)</label>
                    <input type="number" step="0.01" required className={inputClass} value={formData.minInterestRate || ''} onChange={e => setFormData({ ...formData, minInterestRate: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={labelClass}>Max Interest (%)</label>
                    <input type="number" step="0.01" required className={inputClass} value={formData.maxInterestRate || ''} onChange={e => setFormData({ ...formData, maxInterestRate: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Processing Fee (%)</label>
                  <input type="number" step="0.01" required placeholder="e.g. 1.0" className={inputClass} value={formData.processingFee || ''} onChange={e => setFormData({ ...formData, processingFee: Number(e.target.value) })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Min Tenure (Mo)</label>
                    <input type="number" required className={inputClass} value={formData.minTenure || ''} onChange={e => setFormData({ ...formData, minTenure: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={labelClass}>Max Tenure (Mo)</label>
                    <input type="number" required className={inputClass} value={formData.maxTenure || ''} onChange={e => setFormData({ ...formData, maxTenure: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-sans uppercase tracking-widest text-[#5A5A40] font-bold mb-3">Eligibility Criteria</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>Min Age</label>
                      <input type="number" className={inputClass} value={formData.minAge || ''} onChange={e => setFormData({ ...formData, minAge: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className={labelClass}>Max Age</label>
                      <input type="number" className={inputClass} value={formData.maxAge || ''} onChange={e => setFormData({ ...formData, maxAge: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>Min Salary (Tier 1)</label>
                      <input type="number" className={inputClass} value={formData.minNetSalaryTier1 || ''} onChange={e => setFormData({ ...formData, minNetSalaryTier1: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className={labelClass}>Min Salary (Tier 2)</label>
                      <input type="number" className={inputClass} value={formData.minNetSalaryTier2 || ''} onChange={e => setFormData({ ...formData, minNetSalaryTier2: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className={labelClass}>Employment Type</label>
                    <select className={inputClass} value={formData.employmentType || 'Both'} onChange={e => setFormData({ ...formData, employmentType: e.target.value as any })}>
                      <option value="Salaried">Salaried</option>
                      <option value="Self-employed">Self-employed</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>Min Work Exp</label>
                      <input type="text" placeholder="e.g. 2 Years" className={inputClass} value={formData.minWorkExperience || ''} onChange={e => setFormData({ ...formData, minWorkExperience: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Salary Mode</label>
                      <input type="text" placeholder="e.g. Bank Transfer" className={inputClass} value={formData.salaryMode || ''} onChange={e => setFormData({ ...formData, salaryMode: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>Min CIBIL Score</label>
                      <input type="number" required placeholder="e.g. 750" className={inputClass} value={formData.minCibilScore || ''} onChange={e => setFormData({ ...formData, minCibilScore: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className={labelClass}>FOIR Cap (%)</label>
                      <input type="number" step="0.1" placeholder="e.g. 50" className={inputClass} value={formData.foirCap || ''} onChange={e => setFormData({ ...formData, foirCap: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className={labelClass}>Multiplier (x Salary)</label>
                      <input type="number" step="0.1" placeholder="e.g. 20" className={inputClass} value={formData.multiplier || ''} onChange={e => setFormData({ ...formData, multiplier: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-sans uppercase tracking-widest text-[#5A5A40] font-bold mb-3">Policies & Charges</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Repayment Policy</label>
                      <textarea 
                        className={`${inputClass} min-h-[80px] py-2`} 
                        placeholder="e.g. Flexible repayment options available..."
                        value={formData.repaymentPolicy || ''} 
                        onChange={e => setFormData({ ...formData, repaymentPolicy: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Prepayment Charges</label>
                      <textarea 
                        className={`${inputClass} min-h-[80px] py-2`} 
                        placeholder="e.g. 2% of prepaid amount..."
                        value={formData.prepaymentCharges || ''} 
                        onChange={e => setFormData({ ...formData, prepaymentCharges: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Foreclosure Charges</label>
                      <textarea 
                        className={`${inputClass} min-h-[80px] py-2`} 
                        placeholder="e.g. 4% of outstanding principal..."
                        value={formData.foreclosureCharges || ''} 
                        onChange={e => setFormData({ ...formData, foreclosureCharges: e.target.value })} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Time to Disbursal</label>
                        <input type="text" placeholder="e.g. 2-3 Days" className={inputClass} value={formData.timeToDisbursal || ''} onChange={e => setFormData({ ...formData, timeToDisbursal: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClass}>Stamp Duty Fee</label>
                        <input type="text" placeholder="e.g. ₹500" className={inputClass} value={formData.stampDutyFee || ''} onChange={e => setFormData({ ...formData, stampDutyFee: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>EMI Bounce Charges</label>
                      <input type="text" placeholder="e.g. ₹500 per bounce" className={inputClass} value={formData.emiBounceCharges || ''} onChange={e => setFormData({ ...formData, emiBounceCharges: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Documents Required</label>
                      <textarea 
                        className={`${inputClass} min-h-[80px] py-2`} 
                        placeholder="e.g. PAN, Aadhar, 3 months payslips..."
                        value={formData.documentsRequired || ''} 
                        onChange={e => setFormData({ ...formData, documentsRequired: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Terms & Conditions</label>
                      <textarea 
                        className={`${inputClass} min-h-[80px] py-2`} 
                        placeholder="e.g. Standard bank T&C apply..."
                        value={formData.termsConditions || ''} 
                        onChange={e => setFormData({ ...formData, termsConditions: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-sans uppercase tracking-widest text-[#5A5A40] font-bold mb-3">Bank Contact</h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Contact Person" className={inputClass} value={formData.contactPerson || ''} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="tel" placeholder="Phone" className={inputClass} value={formData.contactPhone || ''} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} />
                      <input type="email" placeholder="Email" className={inputClass} value={formData.contactEmail || ''} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 bg-[#5A5A40] text-white py-2 rounded-lg hover:bg-[#4A4A30] transition-all font-bold flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save Offer'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setFormData({ loanType: 'Personal Loan' }); }} className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="bg-white p-6 rounded-3xl shadow-lg border border-[#5A5A40]/10 space-y-4">
              <h3 className="text-sm font-sans uppercase tracking-widest text-[#5A5A40] font-bold">Data Management</h3>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={exportBanksToExcel}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-2 rounded-lg hover:bg-emerald-100 transition-all font-bold text-xs"
                >
                  <Download className="w-4 h-4" /> Export Banks to Excel
                </button>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={importBanksFromExcel}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <button className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition-all font-bold text-xs">
                    <Upload className="w-4 h-4" /> Import Banks from Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={`${canManageBanks ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
        <div className="relative mb-6">
          <input type="text" placeholder="Search banks..." className={`${inputClass} pl-10 h-12 text-base shadow-sm`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        {offers.filter(o => (o.bankName || '').toLowerCase().includes(searchQuery.toLowerCase())).map((offer, idx) => (
          <div key={`bank-offer-${offer.id}-${idx}`} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-serif font-bold">{offer.bankName}</h3>
                <span className="text-[10px] bg-[#F5F5F0] text-[#5A5A40] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{offer.loanType}</span>
              </div>
              <p className="text-sm text-gray-500 font-serif">₹{offer.minAmount?.toLocaleString('en-IN') || 0} - ₹{offer.maxAmount?.toLocaleString('en-IN') || 0} @ {offer.minInterestRate}%</p>
            </div>
            {canManageBanks && (
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(offer.id); setFormData(offer); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><Edit2 className="w-5 h-5" /></button>
                <button onClick={() => setDeleteConfirmation({ id: offer.id, type: 'bank', name: offer.bankName })} className="p-2 text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
