import React from 'react';
import { UserProfile, LoanType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { IndianRupee, Briefcase, CreditCard, User, ChevronRight, ChevronLeft } from 'lucide-react';

import { useLoanForm } from '../hooks/useLoanForm';
import { StepIndicator } from './loan-form/StepIndicator';
import { LoanTypeStep } from './loan-form/LoanTypeStep';
import { EmploymentStep } from './loan-form/EmploymentStep';
import { FinancialsStep } from './loan-form/FinancialsStep';
import { PersonalStep } from './loan-form/PersonalStep';

import { TOP_COMPANIES } from '../constants/companies';
import { INDIAN_CITIES } from '../constants/cities';

interface LoanFormProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

export const LoanForm: React.FC<LoanFormProps> = ({ onComplete, initialProfile }) => {
  const {
    step,
    loading,
    setLoading,
    formData,
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
  } = useLoanForm({ onComplete, initialProfile });

  const steps = [
    { title: 'Loan Type', icon: <IndianRupee className="w-6 h-6" /> },
    { title: 'Employment', icon: <Briefcase className="w-6 h-6" /> },
    { title: 'Financials', icon: <CreditCard className="w-6 h-6" /> },
    { title: 'Personal', icon: <User className="w-6 h-6" /> },
  ];

  const loanTypes: LoanType[] = ['Personal Loan', 'Home Loan', 'Car Loan', 'Jewelry Loan', 'Business Loan'];

  const filteredCities = INDIAN_CITIES.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  ).slice(0, 5);

  const filteredCompanies = TOP_COMPANIES.filter(company =>
    company.name.toLowerCase().includes(companySearch.toLowerCase())
  ).slice(0, 5);

  const handleSubmit = async () => {
    const { isValid } = validateStep();
    if (!isValid) return;

    setLoading(true);
    try {
      onComplete(formData as UserProfile);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-[40px] p-8 md:p-12 shadow-2xl border border-[#5A5A40]/10">
      <StepIndicator steps={steps} currentStep={step} />

      <AnimatePresence mode="wait">
        <div key={step} className="min-h-[400px]">
          {step === 0 && (
            <LoanTypeStep 
              loanTypes={loanTypes}
              selectedType={formData.loanType}
              onSelect={(type) => updateField('loanType', type)}
              error={errors.loanType}
            />
          )}

          {step === 1 && (
            <EmploymentStep 
              formData={formData}
              updateField={updateField}
              errors={errors}
              companySearch={companySearch}
              setCompanySearch={setCompanySearch}
              showCompanySuggestions={showCompanySuggestions}
              setShowCompanySuggestions={setShowCompanySuggestions}
              filteredCompanies={filteredCompanies}
            />
          )}

          {step === 2 && (
            <FinancialsStep 
              formData={formData}
              updateField={updateField}
              errors={errors}
            />
          )}

          {step === 3 && (
            <PersonalStep 
              formData={formData}
              updateField={updateField}
              errors={errors}
              citySearch={citySearch}
              setCitySearch={setCitySearch}
              showCitySuggestions={showCitySuggestions}
              setShowCitySuggestions={setShowCitySuggestions}
              filteredCities={filteredCities}
            />
          )}
        </div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="mt-12 flex items-center justify-between gap-4 border-t border-[#5A5A40]/10 pt-8">
        <button
          onClick={handleBack}
          disabled={step === 0 || loading}
          className={`
            flex items-center gap-2 px-8 py-4 rounded-full font-sans uppercase tracking-widest font-bold transition-all
            ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-[#5A5A40] hover:bg-[#5A5A40]/5'}
          `}
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>

        <button
          onClick={step === steps.length - 1 ? handleSubmit : handleNext}
          disabled={loading}
          className="bg-[#5A5A40] text-white px-10 py-4 rounded-full font-sans uppercase tracking-widest font-bold hover:bg-[#4A4A30] transition-all shadow-xl hover:shadow-2xl flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {step === steps.length - 1 ? 'Complete Profile' : 'Next Step'}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
