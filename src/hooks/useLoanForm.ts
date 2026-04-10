import { useState } from 'react';
import { UserProfile, LoanType } from '../types';

interface UseLoanFormProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

export function useLoanForm({ onComplete, initialProfile }: UseLoanFormProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    employmentType: initialProfile?.employmentType || 'Salaried',
    companyType: initialProfile?.companyType || 'MNC',
    existingEMIs: initialProfile?.existingEMIs || 0,
    ...initialProfile
  });
  const [citySearch, setCitySearch] = useState(initialProfile?.city || '');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [companySearch, setCompanySearch] = useState(initialProfile?.companyName || '');
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!formData.loanType) newErrors.loanType = "Please select a loan type";
    } else if (step === 1) {
      if (!formData.employmentType) newErrors.employmentType = "Required";
      if (!formData.companyType) newErrors.companyType = "Required";
      if (!formData.companyName) newErrors.companyName = "Company name is required";
      if (formData.workExperience === undefined || formData.workExperience === '') {
        newErrors.workExperience = "Current experience is required";
      }
      if (formData.totalExperience === undefined || formData.totalExperience === '') {
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
      if (formData.age === undefined || formData.age === 0) newErrors.age = "Age is required";
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
      setStep(s => Math.min(s + 1, 3));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const firstErrorKey = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) || 
                         document.querySelector(`input[name="${firstErrorKey}"]`) || 
                         document.querySelector(`select[name="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return {
    step,
    setStep,
    loading,
    setLoading,
    formData,
    setFormData,
    citySearch,
    setCitySearch,
    showCitySuggestions,
    setShowCitySuggestions,
    companySearch,
    setCompanySearch,
    showCompanySuggestions,
    setShowCompanySuggestions,
    errors,
    handleNext,
    handleBack,
    updateField,
    validateStep
  };
}
