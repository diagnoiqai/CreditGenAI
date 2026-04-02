import React, { useState } from 'react';
import { auth } from '../firebase';
import { UserProfile, LoanType } from '../types';
import { apiService } from '../services/apiService';
import { motion, AnimatePresence } from 'motion/react';
import { IndianRupee, Briefcase, CreditCard, User, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

import { TOP_COMPANIES, Company } from '../constants/companies';

interface LoanFormProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara",
  "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar", "Varanasi",
  "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur",
  "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli-Dharwad"
];

export const LoanForm: React.FC<LoanFormProps> = ({ onComplete, initialProfile }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>(initialProfile || {
    employmentType: 'Salaried',
    companyType: 'MNC',
    existingEMIs: 0,
  });
  const [citySearch, setCitySearch] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCities = INDIAN_CITIES.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  ).slice(0, 5);

  const filteredCompanies = TOP_COMPANIES.filter(company =>
    company.name.toLowerCase().includes(companySearch.toLowerCase())
  ).slice(0, 5);

  const steps = [
    { title: 'Loan Type', icon: <IndianRupee className="w-6 h-6" /> },
    { title: 'Employment', icon: <Briefcase className="w-6 h-6" /> },
    { title: 'Financials', icon: <CreditCard className="w-6 h-6" /> },
    { title: 'Personal', icon: <User className="w-6 h-6" /> },
  ];

  const loanTypes: LoanType[] = ['Personal Loan', 'Home Loan', 'Car Loan', 'Jewelry Loan', 'Business Loan'];

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!formData.loanType) newErrors.loanType = "Please select a loan type";
    } else if (step === 1) {
      if (!formData.employmentType) newErrors.employmentType = "Required";
      if (!formData.companyType) newErrors.companyType = "Required";
      if (!formData.companyName) newErrors.companyName = "Company name is required";
      if (!formData.workExperience) newErrors.workExperience = "Current experience is required";
      if (!formData.totalExperience) {
        newErrors.totalExperience = "Total experience is required";
      } else {
        const exp = parseFloat(formData.totalExperience.toString());
        if (isNaN(exp) || exp < 1) {
          newErrors.totalExperience = "Total experience must be at least 1 year";
        }
      }
    } else if (step === 2) {
      if (!formData.monthlyIncome) {
        newErrors.monthlyIncome = "Monthly income is required";
      } else if (formData.monthlyIncome < 10000) {
        newErrors.monthlyIncome = "Minimum monthly take-home should be ₹10,000";
      }
      if (!formData.loanAmountRequired) newErrors.loanAmountRequired = "Loan amount is required";
    } else if (step === 3) {
      if (!formData.age) newErrors.age = "Age is required";
      if (!formData.city) newErrors.city = "City is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.maritalStatus) newErrors.maritalStatus = "Marital status is required";
    }
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const handleNext = () => {
    const { isValid, newErrors } = validateStep();
    if (isValid) {
      setStep(s => Math.min(s + 1, steps.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Find the first error and scroll to it
      const firstErrorKey = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) || document.querySelector(`input[name="${firstErrorKey}"]`) || document.querySelector(`select[name="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    const { isValid } = validateStep();
    if (!isValid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setLoading(true);
    try {
      const profile: UserProfile = {
        ...formData,
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        displayName: auth.currentUser.displayName || '',
        role: 'user',
        lastUpdated: new Date().toISOString(),
      } as UserProfile;

      const success = await apiService.saveUserProfile(profile);
      if (success) {
        onComplete(profile);
      } else {
        alert('Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white border-2 border-[#5A5A40]/10 rounded-2xl p-4 focus:border-[#5A5A40] outline-none transition-all text-lg font-serif";
  const labelClass = "block text-sm font-sans uppercase tracking-widest text-[#5A5A40] mb-2 font-semibold";

  return (
    <div className="max-w-2xl mx-auto p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-[#5A5A40]/5"
      >
        {/* Progress Bar */}
        <div className="flex bg-[#F5F5F0] p-6 gap-4 border-b border-[#5A5A40]/5">
          {steps.map((s, i) => (
            <div key={`step-indicator-${i}`} className="flex-1 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${i <= step ? 'bg-[#5A5A40] text-white' : 'bg-white text-gray-300 border border-gray-200'}`}>
                {i < step ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
              </div>
              <span className={`text-[10px] font-sans uppercase tracking-tighter font-bold ${i <= step ? 'text-[#5A5A40]' : 'text-gray-300'}`}>{s.title}</span>
            </div>
          ))}
        </div>

        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <h2 className="text-3xl font-serif font-bold text-[#1a1a1a] mb-8">What type of loan are you looking for?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loanTypes.map((type, idx) => (
                    <button
                      key={`loan-type-${type}-${idx}`}
                      onClick={() => {
                        setFormData({ ...formData, loanType: type });
                        if (errors.loanType) setErrors(prev => {
                          const { loanType, ...rest } = prev;
                          return rest;
                        });
                        handleNext();
                      }}
                      className={`p-6 rounded-3xl border-2 text-left transition-all hover:shadow-lg ${formData.loanType === type ? 'border-[#5A5A40] bg-[#F5F5F0]' : 'border-gray-100 bg-white'}`}
                    >
                      <span className="text-xl font-serif font-semibold">{type}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <h2 className="text-3xl font-serif font-bold text-[#1a1a1a] mb-8">Employment Details</h2>
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Employment Type</label>
                    <div className="flex gap-4">
                      {['Salaried', 'Self-employed'].map((type, idx) => (
                        <button
                          key={`emp-type-${type}-${idx}`}
                          onClick={() => {
                            setFormData({ ...formData, employmentType: type as any });
                            if (errors.employmentType) setErrors(prev => {
                              const { employmentType, ...rest } = prev;
                              return rest;
                            });
                          }}
                          className={`flex-1 p-4 rounded-2xl border-2 font-serif text-lg ${formData.employmentType === type ? 'border-[#5A5A40] bg-[#F5F5F0]' : 'border-gray-100'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Company Type</label>
                    <select 
                      name="companyType"
                      className={inputClass}
                      value={formData.companyType}
                      onChange={e => {
                        setFormData({ ...formData, companyType: e.target.value as any });
                        if (errors.companyType) setErrors(prev => {
                          const { companyType, ...rest } = prev;
                          return rest;
                        });
                      }}
                    >
                      <option value="MNC">MNC</option>
                      <option value="Startup">Startup</option>
                      <option value="Govt">Govt</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Company Name *</label>
                    <input 
                      name="companyName"
                      type="text" 
                      className={`${inputClass} ${errors.companyName ? 'border-red-500' : ''}`} 
                      placeholder="e.g. Google, Zomato"
                      value={companySearch || formData.companyName || ''}
                      onChange={e => {
                        setCompanySearch(e.target.value);
                        setShowCompanySuggestions(true);
                        setFormData({ ...formData, companyName: e.target.value });
                        if (errors.companyName) setErrors(prev => {
                          const { companyName, ...rest } = prev;
                          return rest;
                        });
                      }}
                      onFocus={() => setShowCompanySuggestions(true)}
                    />
                    {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                    {showCompanySuggestions && companySearch && (
                      <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto">
                        {filteredCompanies.map((company, idx) => (
                          <button
                            key={`company-${company.name}-${idx}`}
                            type="button"
                            className="w-full px-6 py-3 text-left hover:bg-[#F5F5F0] transition-colors font-serif flex justify-between items-center"
                            onClick={() => {
                              setFormData({ ...formData, companyName: company.name, companyTier: company.tier });
                              setCompanySearch(company.name);
                              setShowCompanySuggestions(false);
                              if (errors.companyName) setErrors(prev => {
                                const { companyName, ...rest } = prev;
                                return rest;
                              });
                            }}
                          >
                            <span>{company.name}</span>
                            <span className="text-[10px] font-sans uppercase tracking-widest bg-[#5A5A40]/10 px-2 py-1 rounded-full text-[#5A5A40]">Tier {company.tier}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Work Exp (Current) *</label>
                      <input 
                        name="workExperience"
                        type="text" 
                        className={`${inputClass} ${errors.workExperience ? 'border-red-500' : ''}`} 
                        placeholder="e.g. 2 Years"
                        value={formData.workExperience || ''}
                        onChange={e => {
                          setFormData({ ...formData, workExperience: e.target.value });
                          if (errors.workExperience) setErrors(prev => {
                            const { workExperience, ...rest } = prev;
                            return rest;
                          });
                        }}
                      />
                      {errors.workExperience && <p className="text-red-500 text-xs mt-1">{errors.workExperience}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Total Work Exp *</label>
                      <input 
                        name="totalExperience"
                        type="text" 
                        className={`${inputClass} ${errors.totalExperience ? 'border-red-500' : ''}`} 
                        placeholder="e.g. 5 Years"
                        value={formData.totalExperience || ''}
                        onChange={e => {
                          setFormData({ ...formData, totalExperience: e.target.value });
                          if (errors.totalExperience) setErrors(prev => {
                            const { totalExperience, ...rest } = prev;
                            return rest;
                          });
                        }}
                      />
                      {errors.totalExperience && <p className="text-red-500 text-xs mt-1">{errors.totalExperience}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <h2 className="text-3xl font-serif font-bold text-[#1a1a1a] mb-8">Financial Overview</h2>
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Monthly Take-home Income (₹) *</label>
                    <input 
                      name="monthlyIncome"
                      type="number" 
                      className={`${inputClass} ${errors.monthlyIncome ? 'border-red-500' : ''}`} 
                      placeholder="₹ 50,000"
                      value={formData.monthlyIncome || ''}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      onChange={e => {
                        setFormData({ ...formData, monthlyIncome: Number(e.target.value) });
                        if (errors.monthlyIncome) setErrors(prev => {
                          const { monthlyIncome, ...rest } = prev;
                          return rest;
                        });
                      }}
                    />
                    {errors.monthlyIncome && <p className="text-red-500 text-xs mt-1">{errors.monthlyIncome}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Existing Monthly EMIs (₹)</label>
                    <input 
                      name="existingEMIs"
                      type="number" 
                      className={inputClass} 
                      placeholder="₹ 0"
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={formData.existingEMIs || ''}
                      onChange={e => setFormData({ ...formData, existingEMIs: Number(e.target.value) })}
                    />
                    <p className="text-[10px] text-gray-400 mt-1 italic">Enter 0 if no existing EMIs</p>
                  </div>
                  <div>
                    <label className={labelClass}>Loan Amount Required (₹) *</label>
                    <input 
                      name="loanAmountRequired"
                      type="number" 
                      className={`${inputClass} ${errors.loanAmountRequired ? 'border-red-500' : ''}`} 
                      placeholder="₹ 5,00,000"
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={formData.loanAmountRequired || ''}
                      onChange={e => {
                        setFormData({ ...formData, loanAmountRequired: Number(e.target.value) });
                        if (errors.loanAmountRequired) setErrors(prev => {
                          const { loanAmountRequired, ...rest } = prev;
                          return rest;
                        });
                      }}
                    />
                    {errors.loanAmountRequired && <p className="text-red-500 text-xs mt-1">{errors.loanAmountRequired}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <h2 className="text-3xl font-serif font-bold text-[#1a1a1a] mb-8">Personal Details</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Age *</label>
                      <input 
                        name="age"
                        type="number" 
                        className={`${inputClass} ${errors.age ? 'border-red-500' : ''}`} 
                        placeholder="25"
                        value={formData.age || ''}
                        onChange={e => {
                        setFormData({ ...formData, age: Number(e.target.value) });
                        if (errors.age) setErrors(prev => {
                          const { age, ...rest } = prev;
                          return rest;
                        });
                      }}
                      />
                      {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                    </div>
                    <div className="relative">
                      <label className={labelClass}>City *</label>
                      <input 
                        name="city"
                        type="text" 
                        className={`${inputClass} ${errors.city ? 'border-red-500' : ''}`} 
                        placeholder="Mumbai"
                        value={citySearch || formData.city || ''}
                        onChange={e => {
                          setCitySearch(e.target.value);
                          setShowCitySuggestions(true);
                          setFormData({ ...formData, city: e.target.value });
                          if (errors.city) setErrors(prev => {
                            const { city, ...rest } = prev;
                            return rest;
                          });
                        }}
                        onFocus={() => setShowCitySuggestions(true)}
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                      {showCitySuggestions && citySearch && (
                        <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                          {filteredCities.map((city, idx) => (
                            <button
                              key={`city-${city}-${idx}`}
                              type="button"
                              className="w-full px-6 py-3 text-left hover:bg-[#F5F5F0] transition-colors font-serif"
                              onClick={() => {
                                setFormData({ ...formData, city });
                                setCitySearch(city);
                                setShowCitySuggestions(false);
                                if (errors.city) setErrors(prev => {
                                  const { city, ...rest } = prev;
                                  return rest;
                                });
                              }}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Gender *</label>
                      <select 
                        name="gender"
                        className={`${inputClass} ${errors.gender ? 'border-red-500' : ''}`}
                        value={formData.gender || ''}
                        onChange={e => {
                          setFormData({ ...formData, gender: e.target.value as any });
                          if (errors.gender) setErrors(prev => {
                            const { gender, ...rest } = prev;
                            return rest;
                          });
                        }}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Marital Status *</label>
                      <select 
                        name="maritalStatus"
                        className={`${inputClass} ${errors.maritalStatus ? 'border-red-500' : ''}`}
                        value={formData.maritalStatus || ''}
                        onChange={e => {
                          setFormData({ ...formData, maritalStatus: e.target.value as any });
                          if (errors.maritalStatus) setErrors(prev => {
                            const { maritalStatus, ...rest } = prev;
                            return rest;
                          });
                        }}
                      >
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                      </select>
                      {errors.maritalStatus && <p className="text-red-500 text-xs mt-1">{errors.maritalStatus}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>CIBIL Score (Optional)</label>
                    <input 
                      name="cibilScore"
                      type="number" 
                      className={inputClass} 
                      placeholder="750"
                      value={formData.cibilScore || ''}
                      onChange={e => setFormData({ ...formData, cibilScore: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Mobile Number (Optional)</label>
                    <input 
                      type="tel" 
                      className={inputClass} 
                      placeholder="+91 98765 43210"
                      value={formData.mobile || ''}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 space-y-4">
            {Object.keys(errors).length > 0 && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-2xl border border-red-100"
              >
                Please fill in all mandatory fields marked with *
              </motion.p>
            )}
            <div className="flex gap-4">
              {step > 0 && (
                <button 
                  onClick={handleBack}
                  className="flex-1 py-4 px-6 rounded-full border-2 border-[#5A5A40]/20 text-[#5A5A40] font-serif flex items-center justify-center gap-2 hover:bg-[#F5F5F0] transition-all"
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
              )}
              {step < steps.length - 1 ? (
                <button 
                  onClick={handleNext}
                  className="flex-[2] py-4 px-6 rounded-full bg-[#5A5A40] text-white font-serif flex items-center justify-center gap-2 hover:bg-[#4A4A30] transition-all shadow-lg"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] py-4 px-6 rounded-full bg-[#5A5A40] text-white font-serif flex items-center justify-center gap-2 hover:bg-[#4A4A30] transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : initialProfile ? 'Update Details' : 'Submit Details'} <CheckCircle2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
