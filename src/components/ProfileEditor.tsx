import React, { useState } from 'react';
import { UserProfile, LoanType } from '../types';
import { motion } from 'motion/react';
import { Save, X, User, Briefcase, IndianRupee, MapPin, CreditCard } from 'lucide-react';
import { apiService } from '../services/apiService';

interface ProfileEditorProps {
  profile: UserProfile;
  onClose: () => void;
  onUpdate: (updated: UserProfile) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);

  const loanTypes: LoanType[] = ['Personal Loan', 'Business Loan', 'Home Loan', 'Loan Against Property'];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiService.updateUserProfile(profile.uid, formData);
      onUpdate(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="bg-white border border-[#5A5A40]/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-[#5A5A40]/5 pb-3">
        <div className="text-[#5A5A40]">{icon}</div>
        <h3 className="font-serif font-bold text-lg uppercase tracking-wider">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value, onChange, type = 'text', options }: any) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#5A5A40]/60 font-bold ml-1">{label}</label>
      {options ? (
        <select 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#F5F5F0]/50 border border-[#5A5A40]/10 rounded-xl px-4 py-3 font-sans text-sm outline-none focus:ring-1 focus:ring-[#5A5A40] transition-all"
        >
          <option value="">Select Option</option>
          {options.map((o: any) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input 
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#F5F5F0]/50 border border-[#5A5A40]/10 rounded-xl px-4 py-3 font-sans text-sm outline-none focus:ring-1 focus:ring-[#5A5A40] transition-all"
        />
      )}
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold italic">Refine Your Profile</h2>
          <p className="text-[#5A5A40]/60 text-sm font-serif">Updated details help our AI find better matches.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-sans uppercase tracking-widest text-[#5A5A40]/60 text-xs hover:bg-[#5A5A40]/5 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#5A5A40] text-white px-8 py-2.5 rounded-full font-sans uppercase tracking-widest text-xs font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      <Section title="Loan Interest" icon={<IndianRupee size={20} />}>
        <Field 
          label="Loan Amount Required" 
          type="number" 
          value={formData.loanAmountRequired} 
          onChange={(v: any) => setFormData({...formData, loanAmountRequired: Number(v)})} 
        />
        <Field 
          label="Loan Type" 
          options={loanTypes} 
          value={formData.loanType} 
          onChange={(v: any) => setFormData({...formData, loanType: v as LoanType})} 
        />
      </Section>

      <Section title="Professional Details" icon={<Briefcase size={20} />}>
        <Field 
          label="Employment Type" 
          options={['Salaried', 'Self-employed']} 
          value={formData.employmentType} 
          onChange={(v: any) => setFormData({...formData, employmentType: v})} 
        />
        <Field 
          label="Monthly Income" 
          type="number" 
          value={formData.monthlyIncome} 
          onChange={(v: any) => setFormData({...formData, monthlyIncome: Number(v)})} 
        />
        <Field 
          label="Company Name" 
          value={formData.companyName} 
          onChange={(v: any) => setFormData({...formData, companyName: v})} 
        />
        <Field 
          label="Total Experience (Years)" 
          value={formData.totalExperience} 
          onChange={(v: any) => setFormData({...formData, totalExperience: v})} 
        />
      </Section>

      <Section title="Financial & Personal" icon={<CreditCard size={20} />}>
        <Field 
          label="CIBIL Score" 
          type="number" 
          value={formData.cibilScore} 
          onChange={(v: any) => setFormData({...formData, cibilScore: Number(v)})} 
        />
        <Field 
          label="Existing EMIs" 
          type="number" 
          value={formData.existingEMIs} 
          onChange={(v: any) => setFormData({...formData, existingEMIs: Number(v)})} 
        />
        <Field 
          label="Age" 
          type="number" 
          value={formData.age} 
          onChange={(v: any) => setFormData({...formData, age: Number(v)})} 
        />
        <Field 
          label="Marital Status" 
          options={['Single', 'Married', 'Divorced', 'Other']}
          value={formData.maritalStatus} 
          onChange={(v: any) => setFormData({...formData, maritalStatus: v})} 
        />
      </Section>

      <Section title="Location" icon={<MapPin size={20} />}>
        <Field 
          label="City" 
          value={formData.city} 
          onChange={(v: any) => setFormData({...formData, city: v})} 
        />
      </Section>
    </motion.div>
  );
};
