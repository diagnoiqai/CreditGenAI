import React from 'react';
import { UserProfile, BankOffer } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Star, TrendingUp, ShieldCheck } from 'lucide-react';
import { BankDetailModal } from './BankDetailModal';
import { BankData } from '../constants/bankData';

interface OffersMarketplaceProps {
  profile: UserProfile;
  offers: BankOffer[];
  highlightedIds: string[];
  onAskAI?: (text: string) => void;
  isLocked?: boolean;
}

export const OffersMarketplace: React.FC<OffersMarketplaceProps> = ({ profile, offers, highlightedIds, onAskAI, isLocked = false }) => {
  const [selectedBank, setSelectedBank] = React.useState<BankData | null>(null);
  const [showBankModal, setShowBankModal] = React.useState(false);

  // Advanced Scoring & Sorting Logic
  const scoredOffers = React.useMemo(() => {
    if (isLocked) return [];
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
    <div className="h-full flex flex-col bg-[#F2F5FB]">
      {/* Header Info */}
      <div className="px-6 md:px-12 pt-8 pb-6 shrink-0">
        <h2 className="text-3xl font-bold tracking-tight font-display text-[#0D1626]">Best Matches</h2>
        <p className="text-[#4A5878] text-sm font-medium mt-1">Based on your {profile.loanType || 'Personal Loan'} requirements</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-12 pb-[calc(5rem+var(--safe-bottom))] custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-4 py-6">
          {isLocked ? (
            <OnboardingSkeleton />
          ) : scoredOffers.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key="ai-matched-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {topOffer && (
                  <div className="relative">
                    <div className="absolute -top-3 -right-2 md:-right-4 bg-yellow-400 text-yellow-900 px-4 md:px-6 py-1.5 rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 z-10 rotate-2 animate-pulse">
                      <Star className="fill-yellow-900" size={12} /> Top Match
                    </div>
                    <AIMatchedCard 
                      offer={topOffer}
                      profile={profile}
                      onViewDetails={() => {
                        setSelectedBank(convertOfferToBankData(topOffer));
                        setShowBankModal(true);
                      }}
                      onApply={() => onAskAI?.(`I would like to apply for ${topOffer.bankName}`)}
                    />
                  </div>
                )}

                {otherOffers.map((offer) => (
                  <AIMatchedCard
                    key={offer.id}
                    offer={offer}
                    profile={profile}
                    onViewDetails={() => {
                      setSelectedBank(convertOfferToBankData(offer));
                      setShowBankModal(true);
                    }}
                    onApply={() => onAskAI?.(`I would like to apply for ${offer.bankName}`)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center mx-auto shadow-sm border border-[#E4EAF4]">
                <TrendingUp className="text-[#8E9BB8] w-10 h-10" />
              </div>
              <p className="text-[#8E9BB8] font-display text-lg">Finding the best matches for your profile...</p>
            </div>
          )}
        </div>
      </div>

      {/* Bank Detail Modal */}
      <BankDetailModal
        bank={selectedBank}
        isOpen={showBankModal}
        onClose={() => {
          setShowBankModal(false);
          setSelectedBank(null);
        }}
        onApply={(bankName) => {
          onAskAI?.(`I would like to apply for ${bankName}`);
        }}
      />
    </div>
  );
};

/**
 * Convert BankOffer to BankData for modal display
 */
function convertOfferToBankData(offer: BankOffer): BankData {
  return {
    id: parseInt(offer.id),
    name: offer.bankName || 'Bank',
    initials: (offer.bankName || 'BA').substring(0, 2).toUpperCase(),
    logoBg: '#EBF2FF',
    logoText: '#1253C4',
    maxLoan: offer.maxAmount || 2500000,
    minLoan: offer.minAmount || 100000,
    rate: offer.minInterestRate || 10.75,
    minRate: offer.minInterestRate || 10.75,
    maxTenure: offer.maxTenure || 60,
    minTenure: offer.minTenure || 12,
    apr: (offer.minInterestRate || 10.75) + 0.45,
    processingFee: offer.processingFee ? `${offer.processingFee}%` : '1.5% + GST',
    processingTime: offer.timeToDisbursal || '2–3 days',
    approval: 85,
    badge: null,
    docs: []
  };
}

/**
 * AI Matched Card - Display offers using clean BankCard style
 */
interface AIMatchedCardProps {
  offer: BankOffer;
  profile: UserProfile;
  onViewDetails: () => void;
  onApply: () => void;
}

const AIMatchedCard: React.FC<AIMatchedCardProps> = ({ offer, profile, onViewDetails, onApply }) => {
  const calculateEMI = () => {
    const p = profile.loanAmountRequired || 500000;
    const r = ((offer.minInterestRate || 10) / 12) / 100;
    const n = offer.maxTenure || 60;
    if (r === 0) return p / n;
    return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const emi = calculateEMI();

  const getApprovalStyle = () => {
    const score = profile.cibilScore || 750;
    if (score >= 800) return { bg: 'bg-[#E6F9F3]', text: 'text-[#006F47]', label: 'High' };
    if (score >= 750) return { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', label: 'Medium' };
    return { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', label: 'Low' };
  };

  const approvalStyle = getApprovalStyle();
  const bankInitials = (offer.bankName || 'BA').substring(0, 2).toUpperCase();

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-[#E4EAF4] overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md"
    >
      {/* Header: Logo, Name, Apply */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-[#E4EAF4]">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-[#EBF2FF] flex items-center justify-center font-bold text-sm flex-shrink-0 text-[#1253C4]">
            {bankInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#0D1626] text-sm">{offer.bankName || 'Bank'}</p>
          </div>
        </div>
        <button
          onClick={onApply}
          className="px-3 py-2 bg-[#1B6EF3] text-white text-xs font-bold rounded hover:bg-[#0F57D8] transition-colors whitespace-nowrap"
        >
          Apply ↗
        </button>
      </div>

      {/* Hero: Interest Rate | EMI */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-[#E4EAF4]">
        <div>
          <p className="text-xs text-[#8E9BB8] font-semibold uppercase tracking-wide">Interest rate</p>
          <p className="text-2xl font-bold text-[#0D1626] mt-1">
            {offer.minInterestRate}<span className="text-sm font-semibold">% p.a.</span>
          </p>
          <p className="text-xs text-[#8E9BB8] mt-1">Fixed rate</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#8E9BB8] font-semibold uppercase tracking-wide">
            EMI from <span className="font-normal">({formatLakhValue(offer.maxAmount || 500000)} · {offer.maxTenure || 60}mo)</span>
          </p>
          <p className="text-2xl font-bold text-[#0D1626] mt-1">
            {formatRupeeValue(emi)}
          </p>
          <p className="text-xs text-[#8E9BB8] mt-1">per month</p>
        </div>
      </div>

      {/* Metrics: Max Loan, Tenure, Approval */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-[#E4EAF4]">
        <MetricCard label="Max loan" value={formatLakhValue(offer.maxAmount || 2500000)} />
        <MetricCard label="Tenure" value={`${offer.maxTenure || 60} mo`} />
        <div className="text-right">
          <p className="text-xs text-[#8E9BB8] font-semibold uppercase tracking-wide">Approval</p>
          <p className={`text-sm font-bold mt-2 ${approvalStyle.text} ${approvalStyle.bg} px-2 py-1 rounded inline-block`}>
            ● {profile.cibilScore || 750} {approvalStyle.label}
          </p>
        </div>
      </div>

      {/* Footer: View Details */}
      <div className="p-4">
        <button
          onClick={onViewDetails}
          className="w-full text-[#1B6EF3] font-bold text-sm hover:text-[#0F57D8] transition-colors flex items-center justify-center gap-2"
        >
          View details
          <span>↑</span>
        </button>
      </div>
    </motion.article>
  );
};

/**
 * Helper: Format lakh/crore
 */
function formatLakhValue(amount: number): string {
  if (amount >= 10_000_000) return "₹" + (amount / 10_000_000).toFixed(1) + " Cr";
  if (amount >= 100_000) return "₹" + (amount / 100_000).toFixed(0) + " L";
  return "₹" + (amount / 1_000).toFixed(0) + "K";
}

/**
 * Helper: Format rupee with commas
 */
function formatRupeeValue(amount: number): string {
  const n = Math.round(amount);
  return "₹" + n.toLocaleString("en-IN");
}

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-[#8E9BB8] font-semibold uppercase tracking-wide">{label}</p>
    <p className="text-base font-bold text-[#0D1626] mt-1.5">{value}</p>
  </div>
);

/**
 * Skeleton UI for Onboarding State
 */
const OnboardingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl border-2 border-[#E4EAF4]/50 p-4 space-y-4 opacity-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EBF2FF] animate-pulse" />
            <div className="h-4 w-32 bg-[#E4EAF4] rounded animate-pulse" />
          </div>
          <div className="h-20 w-full bg-[#F7F9FD] rounded-xl animate-pulse" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-10 bg-[#F7F9FD] rounded animate-pulse" />
            <div className="h-10 bg-[#F7F9FD] rounded animate-pulse" />
            <div className="h-10 bg-[#F7F9FD] rounded animate-pulse" />
          </div>
        </div>
      ))}
      <div className="col-span-full py-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#E4EAF4] mb-4">
          <ShieldCheck className="text-[#1B6EF3] w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#0D1626] font-display">Securing your custom offers...</h3>
        <p className="text-[#4A5878] text-sm mt-2 max-w-sm mx-auto">
          Please answer the questions on the right. Your data is encrypted and used only to find perfect loan matches.
        </p>
      </div>
    </div>
  );
};
