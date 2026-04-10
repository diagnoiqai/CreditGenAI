import React from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../../types';
import { User, MapPin, Phone, Search } from 'lucide-react';

interface PersonalStepProps {
  formData: Partial<UserProfile>;
  updateField: (field: keyof UserProfile, value: any) => void;
  errors: Record<string, string>;
  citySearch: string;
  setCitySearch: (val: string) => void;
  showCitySuggestions: boolean;
  setShowCitySuggestions: (val: boolean) => void;
  filteredCities: string[];
}

export const PersonalStep: React.FC<PersonalStepProps> = ({
  formData,
  updateField,
  errors,
  citySearch,
  setCitySearch,
  showCitySuggestions,
  setShowCitySuggestions,
  filteredCities
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-3xl font-serif font-bold mb-2">Personal Details</h2>
        <p className="text-[#5A5A40] font-serif italic">Final step! Let's get to know you better.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Age */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
              <User className="w-4 h-4" /> Age
            </label>
            <span className="text-2xl font-serif font-bold text-[#5A5A40]">{formData.age || '18'}</span>
          </div>
          
          {/* Visual Slider */}
          <div className="space-y-3">
            <input
              type="range"
              name="age"
              min="18"
              max="70"
              value={formData.age || 18}
              onChange={(e) => updateField('age', Number(e.target.value))}
              className="w-full h-2 bg-[#5A5A40]/10 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #5A5A40 0%, #5A5A40 ${((formData.age || 18 - 18) / (70 - 18)) * 100}%, #5A5A40/10 ${((formData.age || 18 - 18) / (70 - 18)) * 100}%, #5A5A40/10 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-[#5A5A40]/60 font-sans uppercase tracking-widest">
              <span>18 years</span>
              <span>70 years</span>
            </div>
          </div>

          {errors.age && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{errors.age}</p>}
        </div>

        {/* City */}
        <div className="space-y-3 relative">
          <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Current City
          </label>
          <div className="relative">
            <input
              type="text"
              name="city"
              value={citySearch || formData.city || ''}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setShowCitySuggestions(true);
                updateField('city', e.target.value);
              }}
              onFocus={() => setShowCitySuggestions(true)}
              placeholder="Search city..."
              className={`w-full p-4 pl-12 rounded-2xl border-2 outline-none transition-all font-serif font-bold text-[#1a1a1a] ${errors.city ? 'border-red-500' : 'border-[#5A5A40]/10 focus:border-[#5A5A40]'}`}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40 w-5 h-5" />
          </div>
          {showCitySuggestions && filteredCities.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-[#5A5A40]/10 overflow-hidden">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    updateField('city', city);
                    setCitySearch(city);
                    setShowCitySuggestions(false);
                  }}
                  className="w-full p-4 text-left hover:bg-[#F5F5F0] transition-colors font-serif font-bold text-[#1a1a1a] border-b border-[#5A5A40]/5 last:border-0"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
          {errors.city && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{errors.city}</p>}
        </div>

        {/* Gender */}
        <div className="space-y-3">
          <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
            <User className="w-4 h-4" /> Gender
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['Male', 'Female'].map((gender) => (
              <button
                key={gender}
                onClick={() => updateField('gender', gender)}
                className={`
                  py-4 rounded-2xl border-2 transition-all font-serif font-bold
                  ${formData.gender === gender 
                    ? 'border-[#5A5A40] bg-[#5A5A40] text-white shadow-lg' 
                    : 'border-[#5A5A40]/10 hover:border-[#5A5A40]/30 text-[#5A5A40]'}
                `}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>

        {/* Marital Status */}
        <div className="space-y-3">
          <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
            <User className="w-4 h-4" /> Marital Status
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['Single', 'Married'].map((status) => (
              <button
                key={status}
                onClick={() => updateField('maritalStatus', status)}
                className={`
                  py-4 rounded-2xl border-2 transition-all font-serif font-bold
                  ${formData.maritalStatus === status 
                    ? 'border-[#5A5A40] bg-[#5A5A40] text-white shadow-lg' 
                    : 'border-[#5A5A40]/10 hover:border-[#5A5A40]/30 text-[#5A5A40]'}
                `}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="space-y-3">
          <label className="text-xs font-sans uppercase tracking-widest font-bold text-[#5A5A40] flex items-center gap-2">
            <Phone className="w-4 h-4" /> Mobile Number
          </label>
          <div className="relative">
            <input
              type="tel"
              name="mobile"
              value={formData.mobile || ''}
              onChange={(e) => updateField('mobile', e.target.value)}
              placeholder="10-digit number"
              className="w-full p-4 pl-12 rounded-2xl border-2 border-[#5A5A40]/10 focus:border-[#5A5A40] outline-none transition-all font-serif font-bold text-[#1a1a1a]"
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40 w-5 h-5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
