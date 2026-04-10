import React from 'react';
import { motion } from 'motion/react';
import { UserProfile, Company } from '../../types';
import { Briefcase, Building2, Clock, Search } from 'lucide-react';

interface EmploymentStepProps {
  formData: Partial<UserProfile>;
  updateField: (field: keyof UserProfile, value: any) => void;
  errors: Record<string, string>;
  companySearch: string;
  setCompanySearch: (val: string) => void;
  showCompanySuggestions: boolean;
  setShowCompanySuggestions: (val: boolean) => void;
  filteredCompanies: Company[];
}

export const EmploymentStep: React.FC<EmploymentStepProps> = ({
  formData,
  updateField,
  errors,
  companySearch,
  setCompanySearch,
  showCompanySuggestions,
  setShowCompanySuggestions,
  filteredCompanies
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-3xl font-serif font-bold mb-2">Work Details</h2>
        <p className="text-[#5A5A40] font-serif italic">Tell us about your professional background.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Employment Type */}
        <div className="space-y-3">
          <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Employment Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['Salaried', 'Self-employed'].map((type) => (
              <button
                key={type}
                onClick={() => updateField('employmentType', type as any)}
                className={`
                  py-4 rounded-2xl border-2 transition-all font-serif font-bold
                  ${formData.employmentType === type 
                    ? 'border-[#5A5A40] bg-[#5A5A40] text-white shadow-lg' 
                    : 'border-[#5A5A40]/10 hover:border-[#5A5A40]/30 text-[#5A5A40]'}
                `}
              >
                {type === 'Self-employed' ? 'Self-Employed' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Company Type */}
        <div className="space-y-3">
          <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Company Type
          </label>
          <select
            value={formData.companyType}
            onChange={(e) => updateField('companyType', e.target.value)}
            className="w-full p-4 rounded-2xl border-2 border-[#5A5A40]/10 focus:border-[#5A5A40] outline-none transition-all bg-white font-serif font-bold text-[#1a1a1a]"
          >
            {['MNC', 'Public Ltd', 'Private Ltd', 'Proprietorship', 'Partnership', 'Other'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Company Name */}
        <div className="space-y-3 relative">
          <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Company Name
          </label>
          <div className="relative">
            <input
              type="text"
              name="companyName"
              value={companySearch || formData.companyName || ''}
              onChange={(e) => {
                setCompanySearch(e.target.value);
                setShowCompanySuggestions(true);
                updateField('companyName', e.target.value);
              }}
              onFocus={() => setShowCompanySuggestions(true)}
              placeholder="Search company..."
              className={`w-full p-4 pl-12 rounded-2xl border-2 outline-none transition-all font-serif font-bold text-[#1a1a1a] ${errors.companyName ? 'border-red-500' : 'border-[#5A5A40]/10 focus:border-[#5A5A40]'}`}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40 w-5 h-5" />
          </div>
          {showCompanySuggestions && filteredCompanies.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-[#5A5A40]/10 overflow-hidden">
              {filteredCompanies.map((company) => (
                <button
                  key={company.name}
                  onClick={() => {
                    updateField('companyName', company.name);
                    setCompanySearch(company.name);
                    setShowCompanySuggestions(false);
                  }}
                  className="w-full p-4 text-left hover:bg-[#F5F5F0] transition-colors font-serif font-bold text-[#1a1a1a] flex items-center justify-between border-b border-[#5A5A40]/5 last:border-0"
                >
                  {company.name}
                  <span className="text-[10px] font-sans uppercase tracking-widest text-[#5A5A40]/40">{company.type}</span>
                </button>
              ))}
            </div>
          )}
          {errors.companyName && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{errors.companyName}</p>}
        </div>

        {/* Experience */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
              <Clock className="w-4 h-4" /> Current Exp (Yrs)
            </label>
            <input
              type="number"
              name="workExperience"
              value={formData.workExperience || ''}
              onChange={(e) => updateField('workExperience', e.target.value)}
              className={`w-full p-4 rounded-2xl border-2 outline-none transition-all font-serif font-bold text-[#1a1a1a] ${errors.workExperience ? 'border-red-500' : 'border-[#5A5A40]/10 focus:border-[#5A5A40]'}`}
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
              <Clock className="w-4 h-4" /> Total Exp (Yrs)
            </label>
            <input
              type="number"
              name="totalExperience"
              value={formData.totalExperience || ''}
              onChange={(e) => updateField('totalExperience', e.target.value)}
              className={`w-full p-4 rounded-2xl border-2 outline-none transition-all font-serif font-bold text-[#1a1a1a] ${errors.totalExperience ? 'border-red-500' : 'border-[#5A5A40]/10 focus:border-[#5A5A40]'}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
