import React from 'react';
import { UserProfile, BankOffer } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ShieldCheck, Zap, Info, ArrowUpRight, TrendingUp, Sparkles, Clock, Percent, Calculator } from 'lucide-react';

interface OffersMarketplaceProps {
  profile: UserProfile;
  offers: BankOffer[];
  highlightedIds: string[];
  onAskAI?: (text: string) => void;
}

export const OffersMarketplace: React.FC<OffersMarketplaceProps> = ({ profile, offers, highlightedIds, onAskAI }) => {
  const [viewType, setViewType] = React.useState<'card' | 'table'>('card');

  // Advanced Scoring & Sorting Logic
  const scoredOffers = React.useMemo(() => {
    return [...offers].map(offer => {
      let score = 0;
      
      // Interest Rate Score (Lower is better)
      score += (20 - offer.minInterestRate) * 10;
      
      // Amount Match
      if (profile.loanAmountRequired && profile.loanAmountRequired <= offer.maxAmount) {
        score += 50;
      }

      // CIBIL Match
      if (profile.cibilScore && profile.cibilScore >= offer.minCibilScore) {
        score += 40;
      }

      // AI Highlight Bonus
      if (highlightedIds.includes(offer.id)) {
        score += 100;
      }

      return { ...offer, matchScore: score };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [offers, highlightedIds, profile]);

  const topOffer = scoredOffers[0];
  const otherOffers = scoredOffers.slice(1);

  return (
    <div className="h-full flex flex-col bg-[#F5F5F0]">
      {/* Header Info */}
      <div className="px-6 md:px-12 pt-8 pb-4 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold tracking-tight font-serif italic text-[#1a1a1a]">Best Matches</h2>
           <p className="text-[#5A5A40] text-sm italic font-serif">Based on your {profile.loanType || 'Personal Loan'} requirements</p>
        </div>
        <div className="flex bg-white/50 p-1.5 rounded-2xl border border-[#5A5A40]/10 backdrop-blur-sm self-stretch md:self-auto">
           <button 
             onClick={() => setViewType('table')}
             className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewType === 'table' ? 'bg-[#5A5A40] text-white shadow-lg' : 'text-[#5A5A40] hover:bg-white'}`}
           >
             Table View
           </button>
           <button 
             onClick={() => setViewType('card')}
             className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewType === 'card' ? 'bg-[#5A5A40] text-white shadow-lg' : 'text-[#5A5A40] hover:bg-white'}`}
           >
             Card View
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-12 pb-20 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-10 py-6">
          {scoredOffers.length > 0 ? (
            <AnimatePresence mode="wait">
              {viewType === 'card' ? (
                <motion.div 
                  key="card-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  {/* PHASE 5: HERO CARD FOR #1 BEST MATCH */}
                  {topOffer && (
                    <div className="relative">
                      <div className="absolute -top-4 -right-2 md:-right-4 bg-yellow-400 text-yellow-900 px-4 md:px-6 py-1.5 md:py-2 rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 z-10 rotate-3 animate-pulse">
                        <Star className="fill-yellow-900" size={14} /> Our Top Recommendation
                      </div>
                      <BankCard 
                        offer={topOffer} 
                        index={0} 
                        isHero={true}
                        profile={profile}
                        onAskAI={onAskAI}
                      />
                    </div>
                  )}

                  {/* Other Matching Banks */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A40]/40 px-4">Other Matching Banks ({otherOffers.length})</h3>
                    {otherOffers.map((offer, index) => (
                      <BankCard 
                        key={offer.id} 
                        offer={offer} 
                        index={index + 1} 
                        profile={profile}
                        onAskAI={onAskAI}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="table-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-[40px] border border-[#5A5A40]/10 overflow-hidden shadow-xl"
                >
                  <BankTable 
                    offers={scoredOffers} 
                    profile={profile} 
                    highlightedIds={highlightedIds}
                    onAskAI={onAskAI}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="py-20 text-center space-y-4">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <TrendingUp className="text-gray-300 w-10 h-10" />
               </div>
               <p className="text-gray-400 font-serif italic text-lg">Finding the best matches for your profile...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface BankCardProps {
  offer: BankOffer;
  index: number;
  isHero?: boolean;
  profile: UserProfile;
  onAskAI?: (text: string) => void;
}

const BankCard: React.FC<BankCardProps> = ({ offer, index, isHero, profile, onAskAI }) => {
  // Simple EMI calc: (P * r * (1+r)^n) / ((1+r)^n - 1)
  const calculateEMI = () => {
    const p = profile.loanAmountRequired || 500000;
    const r = (offer.minInterestRate / 12) / 100;
    const n = offer.maxTenure || 60;
    if (r === 0) return p / n;
    return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const emi = calculateEMI();
  
  const getApprovalProb = () => {
    const score = profile.cibilScore || 750;
    if (score >= 800) return 98;
    if (score >= 750) return 85;
    if (score >= 700) return 65;
    return 40;
  };

  const prob = getApprovalProb();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`group relative bg-white rounded-[32px] md:rounded-[48px] p-6 md:p-10 flex flex-col md:flex-row items-stretch gap-6 md:gap-10 border transition-all duration-500 hover:shadow-2xl hover:translate-y-[-4px] ${isHero ? 'border-[#5A5A40]/30 shadow-xl scale-[1.01] bg-gradient-to-br from-white to-[#F5F5F0]/30' : 'border-[#5A5A40]/10'}`}
    >
      {/* 1. Bank Identity */}
      <div className="flex flex-row md:flex-col items-center md:items-start shrink-0 w-full md:w-52 border-b md:border-b-0 md:border-r border-[#5A5A40]/10 pb-6 md:pb-0 md:pr-8 gap-4 md:gap-0">
        <div className="w-14 h-14 md:w-20 md:h-20 bg-[#F5F5F0] rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0 md:mb-6 transition-transform group-hover:scale-105 shadow-inner border border-[#5A5A40]/10">
          <span className="text-xl md:text-3xl font-serif font-bold text-[#5A5A40]">{offer.bankName?.[0]}</span>
        </div>
        <div>
          <h3 className="text-lg md:text-2xl font-serif font-bold text-gray-900 leading-tight">{offer.bankName}</h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
             <span className="px-2 py-0.5 bg-[#5A5A40]/5 rounded-md text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-[#5A5A40]">Verified Partner</span>
             {isHero && <span className="px-2 py-0.5 bg-green-50 rounded-md text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-green-700">Best ROI</span>}
          </div>
        </div>
      </div>

      {/* 2. Metrics (Main Info) */}
      <div className="flex-1 space-y-6 md:space-y-8 py-2 md:py-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <Metric label="Interest Rate" value={`${offer.minInterestRate}%`} subValue="p.a" icon={<Percent size={12} />} color="text-[#5A5A40]" />
          <Metric label="Estimated EMI" value={`₹${Math.round(emi).toLocaleString('en-IN')}`} subValue="/mo" icon={<Calculator size={12} />} />
          <Metric label="Approval" value={`${prob}%`} subValue="Chance" icon={<Sparkles size={12} />} color={prob > 80 ? 'text-green-600' : 'text-amber-600'} />
          <Metric label="Disbursal" value={offer.timeToDisbursal || '48h'} subValue="Time" icon={<Clock size={12} />} />
        </div>

        {/* Info Tags */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-4 border-t border-[#5A5A40]/5">
           <div className="flex items-center gap-1.5">
              <ShieldCheck className="text-[#5A5A40] w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-gray-400">Zero Hidden Costs</span>
           </div>
           <div className="flex items-center gap-1.5">
              <Zap className="text-[#5A5A40] w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-gray-400">Instant Sanction</span>
           </div>
           {offer.maxAmount && (
             <div className="flex items-center gap-1.5">
                <TrendingUp className="text-[#5A5A40] w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-gray-400">Up to ₹{(offer.maxAmount / 100000).toFixed(1)}L</span>
             </div>
           )}
        </div>
      </div>

      {/* 3. Actions */}
      <div className="flex flex-col justify-center gap-3 md:gap-4 shrink-0 w-full md:w-44 border-t md:border-t-0 md:border-l border-[#5A5A40]/10 pt-6 md:pt-0 md:pl-8">
         <button 
           onClick={() => onAskAI?.(`I would like to apply for the ${offer.bankName} ${offer.loanType}.`)}
           className="bg-[#5A5A40] text-white py-3.5 md:py-5 rounded-2xl font-bold hover:bg-[#4A4A30] transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 group/btn relative overflow-hidden"
         >
            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
            Apply Now
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
         </button>
         <button 
           onClick={() => onAskAI?.(`What are the repayment and preclosure policies for ${offer.bankName}?`)}
           className="py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[#5A5A40]/60 hover:text-[#5A5A40] transition-colors"
         >
            View Policy Details
         </button>
      </div>
    </motion.div>
  );
};

const BankTable: React.FC<{ offers: BankOffer[]; profile: UserProfile; highlightedIds: string[]; onAskAI?: (text: string) => void }> = ({ offers, profile, highlightedIds, onAskAI }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse min-w-[800px]">
      <thead>
        <tr className="border-b border-[#5A5A40]/10 bg-[#F5F5F0]/30">
          <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]/60">Bank & Loyalty</th>
          <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]/60 text-center">ROI (p.a)</th>
          <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]/60 text-center">Approx EMI</th>
          <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]/60 text-center">Processing</th>
          <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]/60 text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {offers.map((offer, idx) => {
          const p = profile.loanAmountRequired || 500000;
          const r = (offer.minInterestRate / 12) / 100;
          const n = offer.maxTenure || 60;
          const emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
          const isHighlighted = highlightedIds.includes(offer.id);

          return (
            <motion.tr 
              key={`table-${offer.id}`} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`border-b border-[#5A5A40]/5 transition-all hover:bg-[#F5F5F0]/30 group ${isHighlighted ? 'bg-[#5A5A40]/5' : ''}`}
            >
              <td className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#5A5A40]/10 flex items-center justify-center text-[10px] font-bold text-[#5A5A40] shrink-0">
                    {offer.bankName[0]}
                  </div>
                  <div>
                    <p className="font-serif font-bold text-gray-900">{offer.bankName}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{offer.loanType}</p>
                  </div>
                </div>
              </td>
              <td className="p-6 text-center font-serif font-bold text-[#5A5A40] text-lg">
                {offer.minInterestRate}%
              </td>
              <td className="p-6 text-center">
                <p className="font-serif font-bold text-gray-900">₹{Math.round(emi).toLocaleString('en-IN')}</p>
                <p className="text-[9px] text-gray-400">Estimated</p>
              </td>
              <td className="p-6 text-center">
                 <p className="font-serif font-bold text-gray-900">{offer.processingFee === 0 ? 'NIL' : `${offer.processingFee}%`}</p>
              </td>
              <td className="p-6 text-right">
                <button 
                  onClick={() => onAskAI?.(`I want to apply for ${offer.bankName}`)}
                  className="px-5 py-2 bg-[#5A5A40] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-[#4A4A30] transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                >
                  Apply Now
                </button>
              </td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const Metric = ({ label, value, subValue, icon, color = "text-gray-900" }: { label: string; value: string; subValue: string; icon: React.ReactNode; color?: string }) => (
  <div className="space-y-1 md:space-y-1.5">
    <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] uppercase tracking-widest text-gray-400 font-bold whitespace-nowrap">
      <span className="opacity-70">{icon}</span>
      {label}
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`text-xl md:text-2xl font-serif font-bold ${color}`}>{value}</span>
      <span className="text-[9px] md:text-[10px] text-gray-300 font-bold">{subValue}</span>
    </div>
  </div>
);
