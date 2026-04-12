import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile, ChatMessage, BankOffer, LoanApplication } from "../types";
import { findBestBankMatch, findSimilarBanks, levenshteinDistance } from "../utils/bankMatching";
import { SYSTEM_PROMPT } from "./systemPrompt";

// 🔧 Browser-compatible string hash function (replaces Node.js crypto)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 16); // Convert to base-36, take first 16 chars
}

const getGeminiApiKey = () => {
  // Try process.env (Vite define)
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    console.log('Gemini Service: Using API key from process.env.GEMINI_API_KEY');
    return process.env.GEMINI_API_KEY;
  }
  // Try import.meta.env (Vite standard)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    console.log('Gemini Service: Using API key from import.meta.env.VITE_GEMINI_API_KEY');
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  console.warn('Gemini Service: No API key found in process.env or import.meta.env');
  return '';
};

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const key = getGeminiApiKey();
    if (!key) {
      throw new Error("API key is missing. Please provide a valid API key in your .env file.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

const localCache = new Map<string, { response: any; timestamp: number; tokens?: { input: number; output: number } }>();

// Calculation cache to avoid redundant eligibility calculations
const calculationCache = new Map<string, number>();

// Token usage tracking per session
let totalTokensUsed = { input: 0, output: 0, requests: 0 };

// Performance timing tracking
let requestTimings = {
  totalTime: 0,
  apiTime: 0,
  requestCount: 0,
  cacheHits: 0,
  cacheMisses: 0,
  times: [] as { timestamp: number; duration: number; type: 'cache' | 'api' }[]
};

export function clearAICache() {
  localCache.clear();
  calculationCache.clear();
  totalTokensUsed = { input: 0, output: 0, requests: 0 };
  requestTimings = { totalTime: 0, apiTime: 0, requestCount: 0, cacheHits: 0, cacheMisses: 0, times: [] };
  console.log('INFO: AI Cache and calculations cleared. Token tracking and timings reset.');
}

export function getAICacheData() {
  const cacheData: Record<string, any> = {};
  localCache.forEach((value, key) => {
    cacheData[key] = {
      responseLength: value.response.text?.length || 0,
      tokens: value.tokens,
      cachedAt: new Date(value.timestamp).toISOString()
    };
  });
  return cacheData;
}

export function viewAICache() {
  const cacheData = getAICacheData();
  console.log('📦 AI CACHE CONTENTS:', cacheData);
  console.log(`📊 Total cached items: ${localCache.size}`);
  console.log(`📊 Total tokens used (session): Input=${totalTokensUsed.input}, Output=${totalTokensUsed.output}, Requests=${totalTokensUsed.requests}`);
  return cacheData;
}

// Get token usage statistics 
export function getTokenUsageStats() {
  return {
    totalInput: totalTokensUsed.input,
    totalOutput: totalTokensUsed.output,
    totalRequests: totalTokensUsed.requests,
    averageInputPerRequest: totalTokensUsed.requests > 0 ? Math.round(totalTokensUsed.input / totalTokensUsed.requests) : 0,
    averageOutputPerRequest: totalTokensUsed.requests > 0 ? Math.round(totalTokensUsed.output / totalTokensUsed.requests) : 0,
    cacheHitRate: totalTokensUsed.requests > 0 ? Math.round((requestTimings.cacheHits / totalTokensUsed.requests) * 100) : 0
  };
}

// Get performance timing statistics
export function getPerformanceStats() {
  const avgTime = requestTimings.requestCount > 0 ? Math.round(requestTimings.totalTime / requestTimings.requestCount) : 0;
  const cacheHitRate = requestTimings.requestCount > 0 ? Math.round((requestTimings.cacheHits / requestTimings.requestCount) * 100) : 0;
  const avgApiTime = requestTimings.apiTime > 0 ? Math.round(requestTimings.apiTime / (requestTimings.requestCount - requestTimings.cacheHits || 1)) : 0;
  
  return {
    averageRequestTime: avgTime,
    averageApiTime: avgApiTime,
    totalRequests: requestTimings.requestCount,
    cacheHits: requestTimings.cacheHits,
    cacheMisses: requestTimings.cacheMisses,
    cacheHitRate: cacheHitRate,
    recentTimes: requestTimings.times.slice(-10) // Last 10 requests
  };
}

export async function getAIResponse(
  messages: ChatMessage[], 
  profile: UserProfile, 
  bankOffers: BankOffer[],
  userApplications: LoanApplication[] = []
): Promise<{ text: string, action?: any, suggestions?: string[], tokensUsed?: { input: number; output: number }, timeTaken?: { cacheMs?: number; apiMs?: number; totalMs: number } }> {
  const requestStartTime = performance.now();
  const lastMsg = messages[messages.length - 1]?.content || '';
  
  // 🎯 SMART CACHING: Use simpleHash of user message (not profile data)
  // This means: "Show me best loans" and "Best loans?" = same cache key
  // Why? Similar questions should get cached responses
  const messageHash = simpleHash(lastMsg.toLowerCase().trim());
  
  const CACHE_TTL_MS = 1800000; // 30 minutes
  
  // Check if we have a cached response that's still fresh
  if (localCache.has(messageHash)) {
    const cached = localCache.get(messageHash);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      const cacheResponseTime = performance.now() - requestStartTime;
      console.log(`✅ CACHE HIT: Found response for message hash "${messageHash}"`);
      console.log(`📊 Cache age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s ago`);
      console.log(`⏱️ CACHE TIME: ${(cacheResponseTime / 1000).toFixed(3)}s`);
      
      // Update timing metrics
      requestTimings.cacheHits += 1;
      requestTimings.requestCount += 1;
      requestTimings.totalTime += cacheResponseTime;
      requestTimings.times.push({ timestamp: Date.now(), duration: cacheResponseTime, type: 'cache' });
      
      // Return cached response with timing data
      return { 
        ...cached.response, 
        tokensUsed: cached.tokens,
        timeTaken: { cacheMs: cacheResponseTime, totalMs: Math.round(cacheResponseTime) }
      };
    } else if (cached) {
      // Remove expired cache entry
      localCache.delete(messageHash);
    }
  }
  
  requestTimings.cacheMisses += 1;
  console.log(`🔄 CACHE MISS: Processing new request for message hash "${messageHash}"`);

  // Keyword filter and sorting to keep prompt tiny
  const kw = lastMsg.toLowerCase();
  
  // Dynamic extraction for scoring based on chat context
  let tempSalary = profile.monthlyIncome || 0;
  let tempAmount = profile.loanAmountRequired || 0;
  let tempCibil = profile.cibilScore || 0;
  let tempTenure = 0; // Tenure in years
  let tempRate = 0;

  // Scan messages from newest to oldest to find the most recent mentioned salary/amount/cibil
  let cibilAssumed = false;
  if (!profile.cibilScore) {
    tempCibil = 750;
    cibilAssumed = true;
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== 'user') continue; // Only extract context from user messages
    
    const msg = (m.content || '').toLowerCase();
    
    // Check for reset keywords
    if (msg.includes('profile') || msg.includes('original') || msg.includes('reset')) {
      break; // Stop looking back if user wants to use profile data
    }

    const sMatch = msg.match(/(?:salary|income|package|pay|earn|ctc|pkg)\s*(?:of|is)?\s*₹?([\d,]+(?:\.\d+)?)\s*(l|lakh|k)?/i);
    if (sMatch && tempSalary === (profile.monthlyIncome || 0)) {
      let valStr = sMatch[1].replace(/,/g, '');
      let val = parseFloat(valStr);
      let unit = sMatch[2]?.toLowerCase();
      if (unit === 'l' || unit === 'lakh') val *= 100000;
      else if (unit === 'k') val *= 1000;
      
      // Handle yearly/annual packages
      if (msg.includes('yearly') || msg.includes('annual') || msg.includes('per year') || msg.includes('p.a') || msg.includes('package') || msg.includes('ctc')) {
        val = val / 12;
      }
      tempSalary = val;
    }

    const aMatch = msg.match(/(?:loan|amount|need|require|eligible for|for)\s*(?:of|is)?\s*₹?([\d,]+(?:\.\d+)?)\s*(l|lakh|k)?(?!\s*year|month|yr|mo)/i);
    if (aMatch && tempAmount === (profile.loanAmountRequired || 0)) {
      let valStr = aMatch[1].replace(/,/g, '');
      let val = parseFloat(valStr);
      let unit = aMatch[2]?.toLowerCase();
      if (unit === 'l' || unit === 'lakh') val *= 100000;
      else if (unit === 'k') val *= 1000;
      tempAmount = val;
    }

    const tMatch = msg.match(/(?:for|tenure|duration|period|time)\s*(?:of|is)?\s*(\d+)\s*(year|month|yr|mo)/i);
    if (tMatch && tempTenure === 0) {
      let val = parseInt(tMatch[1]);
      let unit = tMatch[2].toLowerCase();
      if (unit.startsWith('month') || unit.startsWith('mo')) val = val / 12;
      tempTenure = val;
    }

    const rMatch = msg.match(/(?:rate|interest|roi)\s*(?:of|is)?\s*(\d+(?:\.\d+)?)\s*%/i);
    if (rMatch && tempRate === 0) {
      tempRate = parseFloat(rMatch[1]);
    }

    const cMatch = msg.match(/(?:cibil|credit|score)\s*(?:is|of)?\s*(\d{3})/i);
    if (cMatch && tempCibil === (profile.cibilScore || 0)) {
      tempCibil = parseInt(cMatch[1]);
    }
    
    // If we've found all or we've gone back too far, stop
    if (tempSalary !== (profile.monthlyIncome || 0) && 
        tempAmount !== (profile.loanAmountRequired || 0) &&
        tempCibil !== (profile.cibilScore || 0)) break;
    if (i < messages.length - 5) break; // Only look back 5 messages
  }

  // Helper function to check keywords with typo tolerance
  const hasKeywordWithTolerance = (text: string, keywords: string[], maxDistance: number = 2): boolean => {
    const words = text.toLowerCase().split(/\s+/);
    for (const keyword of keywords) {
      for (const word of words) {
        const distance = levenshteinDistance(word, keyword);
        if (distance <= maxDistance) {
          return true;
        }
      }
    }
    return false;
  };

  // Detect if user is asking about policies or comparisons (with typo tolerance)
  const policyKeywords = ['policy', 'preclosure', 'pre-closure', 'foreclosure', 'forecloser', 'charges', 'terms', 'condition'];
  const compareKeywords = ['compare', 'versus', 'vs', 'difference', 'better', 'best'];
  
  const isPolicyQuery = hasKeywordWithTolerance(kw, policyKeywords);
  const isCompareQuery = hasKeywordWithTolerance(kw, compareKeywords);
  
  // Use hybrid bank matching to find mentioned bank (handles typos and aliases)
  let mentionedBank = findBestBankMatch(lastMsg, bankOffers);
  let mentionedBanks: BankOffer[] = []; // For comparison queries with multiple banks
  
  // If exact match fails but policy/compare query, try to extract bank names from keywords
  if (!mentionedBank && (isPolicyQuery || isCompareQuery)) {
    const bankKeywords = ['icici', 'hdfc', 'axis', 'sbi', 'bob', 'boi', 'union', 'idbi', 'kotak', 'indusind', 'standard', 'yebank', 'rbl', 'sc', 'scb'];
    
    // For comparison queries, find ALL mentioned banks
    if (isCompareQuery) {
      const foundMatches: { keyword: string; distance: number }[] = [];
      for (const keyword of bankKeywords) {
        const words = kw.split(/\s+/);
        for (const word of words) {
          const distance = levenshteinDistance(word, keyword);
          if (distance <= 2) { // Allow up to 2 character edits
            // Check if this keyword is already found
            if (!foundMatches.find(m => m.keyword === keyword)) {
              foundMatches.push({ keyword, distance });
            }
          }
        }
      }
      
      // Sort by distance and keep all matches
      foundMatches.sort((a, b) => a.distance - b.distance);
      
      mentionedBanks = foundMatches
        .map(match => findBestBankMatch(match.keyword, bankOffers))
        .filter((b): b is BankOffer => b !== null);
    } else {
      // For single policy queries, find only first bank
      let bestMatch: { keyword: string; distance: number } | null = null;
      for (const keyword of bankKeywords) {
        const words = kw.split(/\s+/);
        for (const word of words) {
          const distance = levenshteinDistance(word, keyword);
          if (distance <= 2) { // Allow up to 2 character edits
            if (!bestMatch || distance < bestMatch.distance) {
              bestMatch = { keyword, distance };
            }
          }
        }
      }
      
      if (bestMatch) {
        mentionedBank = findBestBankMatch(bestMatch.keyword, bankOffers);
      }
    }
  }

  let sortedOffers = [...bankOffers];

  const isHighest = kw.includes('highest') || kw.includes('max') || kw.includes('most');
  const isLowest = kw.includes('lowest') || kw.includes('min') || kw.includes('least') || kw.includes('cheap');
  const isBest = kw.includes('best') || kw.includes('top') || kw.includes('recommend') || kw.includes('match');
  const requiredAmount = tempAmount;

  const calculateMaxEligibleLoan = (offer: BankOffer) => {
    // 🎯 CALCULATION CACHING: Avoid recalculating same eligibility
    // Why? We calculate this 3+ times per offer (satisfiesAmount, getScore, mapping)
    // Cache key: bankId + income + EMIs (these are the only factors that matter)
    const cacheKey = `eligibility_${offer.id}_${tempSalary}_${profile.existingEMIs || 0}`;
    
    if (calculationCache.has(cacheKey)) {
      return calculationCache.get(cacheKey)!;
    }
    
    const income = tempSalary;
    const emis = profile.existingEMIs || 0;
    const isLowCibil = tempCibil && tempCibil < 750;
    const rate = (isLowCibil && offer.interestRateBelow750) ? offer.interestRateBelow750 : offer.minInterestRate;
    const bankMax = (isLowCibil && offer.maxAmountPercentBelow750) ? (offer.maxAmount * offer.maxAmountPercentBelow750 / 100) : offer.maxAmount;
    
    const foir = 0.5; // 50% FOIR
    const availableEMI = (income * foir) - emis;
    if (availableEMI <= 0) {
      calculationCache.set(cacheKey, 0);
      return 0;
    }

    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) {
      calculationCache.set(cacheKey, bankMax);
      return bankMax;
    }

    const tenure = offer.maxTenure;
    const maxLoan = availableEMI * ((1 - Math.pow(1 + monthlyRate, -tenure)) / monthlyRate);
    const result = Math.min(Math.round(maxLoan), bankMax);
    
    // Store in cache for next use
    calculationCache.set(cacheKey, result);
    return result;
  };

  const satisfiesAmount = (offer: BankOffer) => {
    if (requiredAmount === 0) return true;
    const maxEligible = calculateMaxEligibleLoan(offer);
    // Must be within bank's absolute limits AND user's personal eligibility limit
    return maxEligible >= requiredAmount && 
           requiredAmount >= offer.minAmount && 
           requiredAmount <= offer.maxAmount;
  };

  const getScore = (offer: BankOffer) => {
    const maxEligible = calculateMaxEligibleLoan(offer);
    const satisfies = satisfiesAmount(offer);
    const isLowCibil = tempCibil && tempCibil < 750;
    const rate = (isLowCibil && offer.interestRateBelow750) ? offer.interestRateBelow750 : offer.minInterestRate;

    let score = 0;
    let reasons: string[] = [];
    
    // 0. CIBIL Eligibility (Hard Filter)
    if (tempCibil < offer.minCibilScore) {
      reasons.push(`Ineligible: Your CIBIL ${tempCibil} < Bank Min ${offer.minCibilScore}`);
      // Don't return 0 score yet, give partial credit if it's close or if they are asking specifically
    } else {
      score += 2000000; // Large bonus for meeting CIBIL
    }
    // If you aren't eligible, interest rate doesn't matter.
    if (satisfies) {
      score += 1000000;
    } else {
      if (maxEligible < requiredAmount) {
        reasons.push(`Ineligible: Your personal limit ₹${(maxEligible/100000).toFixed(2)}L < Required ₹${(requiredAmount/100000).toFixed(2)}L`);
      }
      if (requiredAmount < offer.minAmount) {
        reasons.push(`Ineligible: Required ₹${(requiredAmount/100000).toFixed(2)}L < Bank Min ₹${(offer.minAmount/100000).toFixed(2)}L`);
      }
      if (requiredAmount > offer.maxAmount) {
        reasons.push(`Ineligible: Required ₹${(requiredAmount/100000).toFixed(2)}L > Bank Max ₹${(offer.maxAmount/100000).toFixed(2)}L`);
      }
      
      if (maxEligible >= requiredAmount * 0.9) {
        score += 200000; // High partial credit
      } else if (maxEligible >= requiredAmount * 0.7) {
        score += 100000; // Low partial credit
      }
    }

    // 2. Interest rate (Dominant factor for eligible banks - 50,000 points per 1%)
    // A 2% rate difference (100k points) is now very significant.
    score += (100 - rate) * 50000;
    
    // 3. Loan Type Match (300,000 points)
    // Important, but a 6% interest rate difference can now override a type mismatch.
    if (profile.loanType && offer.loanType === profile.loanType) {
      score += 300000;
    } else if (profile.loanType) {
      reasons.push(`Type Mismatch (User: ${profile.loanType}, Bank: ${offer.loanType})`);
    }
    
    // 4. CIBIL Score match (50,000 points)
    if (profile.cibilScore && profile.cibilScore >= offer.minCibilScore) {
      score += 50000;
    } else if (profile.cibilScore) {
      reasons.push(`CIBIL too low (User: ${profile.cibilScore}, Min: ${offer.minCibilScore})`);
    }

    // 5. Loan amount (Tie-breaker only)
    score += (maxEligible / 100000); 
    
    return { score, reasons };
  };

  const eligibilityReason = ((profile.monthlyIncome || 0) * 0.5) <= (profile.existingEMIs || 0) 
    ? "Your existing EMIs are high compared to your income (FOIR > 50%)." 
    : "";

  // Sort by score first
  const scoredOffers = sortedOffers.map(o => ({ ...o, ...getScore(o) }));
  scoredOffers.sort((a, b) => b.score - a.score);

  // Filtering logic: 
  // If "best" or "recommend" is asked, we want the top overall matches.
  // If specific banks are mentioned, we MUST include them.
  // For policy queries on specific banks, return ONLY that bank.
  // For comparison queries, return ONLY the compared banks.
  let finalOffers: any[] = [];
  
  if (isCompareQuery && mentionedBanks.length > 0) {
    // Comparison query with multiple banks - return ONLY those banks

    finalOffers = scoredOffers.filter(o => 
      mentionedBanks.some(b => b.id === o.id)
    );
  } else if (isPolicyQuery && mentionedBank) {
    // For policy queries (preclosure, charges, terms) with specific bank mentioned
    // Return ONLY that bank's information

    finalOffers = scoredOffers.filter(o => 
      (o.bankName || '').toLowerCase().includes((mentionedBank!.bankName || '').toLowerCase())
    );
  } else if (isBest) {
    // For "best" queries, take top 11 overall
    finalOffers = scoredOffers.slice(0, 11);
  } else {
    // Check if any specific banks or loan types are mentioned
    const mentionedOffers = scoredOffers.filter(o => 
      (o.bankName || '').toLowerCase().includes(kw) || 
      (o.loanType || '').toLowerCase().includes(kw)
    );
    
    if (mentionedOffers.length > 0) {
      // Include mentioned ones + top overall to fill up to 11
      const topOverall = scoredOffers.filter(o => !mentionedOffers.find(m => m.id === o.id)).slice(0, 11 - mentionedOffers.length);
      finalOffers = [...mentionedOffers, ...topOverall].sort((a, b) => b.score - a.score);
    } else {
      finalOffers = scoredOffers.slice(0, 11);
    }
  }


  
  
  // Check for any rejected applications and extract the reason
  const rejectedApp = userApplications.find(a => a.status === 'Rejected' && (a.rejectionReason || a.statusNotes));
  const actualRejectionReason = rejectedApp ? `ACTUAL REJECTION REASON/NOTE FROM BANK (${rejectedApp.bankName}): "${rejectedApp.rejectionReason || rejectedApp.statusNotes}"` : '';

  const prompt = `
CRITICAL CONTEXT: The user is currently discussing a scenario with:
- Monthly Income: ₹${tempSalary}
- Requested Loan: ₹${tempAmount}
- Requested Tenure: ${tempTenure > 0 ? `${tempTenure} years` : 'Not specified (Assume 5 years for EMI calculation if not mentioned)'}
- CIBIL Score: ${tempCibil}
- Existing EMIs: ₹${profile.existingEMIs || 0}
- Employment: ${profile.employmentType}
- City: ${profile.city}
- Total Experience: ${profile.totalExperience}

${actualRejectionReason ? `MANDATORY: ${actualRejectionReason}. If the user asks why they were rejected, you MUST use THIS specific reason and NOT give general advice.` : ''}

User Applications: ${JSON.stringify(userApplications.map(a => ({
  bankName: a.bankName,
  status: a.status,
  subStatus: a.subStatus,
  rejectionReason: a.rejectionReason,
  statusNotes: a.statusNotes,
  timestamp: a.timestamp
})))}

${cibilAssumed ? 'IMPORTANT: The user has NOT provided a CIBIL score. You MUST explicitly mention in your response that you are assuming a CIBIL score of 750+ for this analysis.' : ''}

DO NOT use the user's base profile data if it differs from the above. All calculations and advice MUST be based on these values.
If the user mentions a CIBIL of 600, do NOT say "your excellent CIBIL of 780". Use 600.

${eligibilityReason ? `Eligibility Note: ${eligibilityReason}` : ''}
Offers (Sorted by score): ${JSON.stringify(finalOffers.map(o => ({ 
  id: o.id, 
  name: o.bankName, 
  rate: o.minInterestRate, 
  minCibil: o.minCibilScore,
  maxEligible: calculateMaxEligibleLoan(o),
  satisfies: satisfiesAmount(o),
  score: o.score,
  reasons: o.reasons,
  repaymentPolicy: o.repaymentPolicy,
  preclosureCharges: o.preclosureCharges,
  termsConditions: o.termsConditions
})))}
User: ${lastMsg}

🚨 CRITICAL CONSTRAINT: Only mention banks that are in the "Offers (Sorted by score)" list above. DO NOT mention, reference, or discuss any banks that are not in that list. If only 1 bank is in the list, ONLY discuss that 1 bank - do not add information about other banks.

Rules:
- Use action type "ELIGIBILITY_SUMMARY" for eligibility/amount queries.
- Use action type "COMPARE_OFFERS" for comparison/finding offers.
- Use action type "CALCULATE_EMI" for EMI queries or when the user wants to use a calculator.
- Use action type "CHECK_APPLICATION_STATUS" if the user asks about the status of their loan application or what's happening with their profile.
- Use action type "SEARCH_POLICIES" if the user asks about repayment, preclosure, or terms. Include the search query in the data object as "query": "bank name + policy type".
- If the user has a REJECTED application, and asks about their status or "Why was I rejected?", ALWAYS explain the specific rejectionReason or the latest statusNotes in your text response in a polite, empathetic, and professional way.
- DO NOT give general details if a specific rejectionReason or statusNotes is available in the data.
- If the reason/note is blunt (e.g., "CIBIL too low"), rephrase it politely (e.g., "Your credit score is currently below the bank's minimum requirement") without mentioning you are rephrasing it.
- Include "Why was my application rejected?" in suggestions if they have a rejected application.
- If the user has any application, include "Check my application status" in suggestions.
- If the user has already applied to a bank, don't suggest applying again to the same bank unless it was rejected more than 6 months ago.
- CRITICAL: When comparing two or more banks, ALWAYS use a SINGLE "COMPARE_OFFERS" action with all relevant bank IDs in the "bankIds" array. DO NOT return multiple actions or messages for comparison.
- CRITICAL: The "Offers" list is already sorted by a robust scoring engine. The first bank is the mathematically "Best Match".
- CRITICAL: ONLY respond about banks in the provided Offers list. Do NOT hallucinate or add banks not in the list. If the list has 1 bank, respond ONLY about that 1 bank.
- If a bank has a higher rate but is ranked higher, explain why (e.g. "Only bank where you meet the minimum CIBIL requirement").
- If the user asks about a specific bank like "Fullerton", and it's in the list, explain its eligibility based on the dynamic CIBIL ${tempCibil}.
- If the user asks for more than they are eligible for, tell them the maximum they can get based on their income (usually 10-15x monthly income).
- Provide specific details like repayment policy, preclosure charges, and terms & conditions if the user asks about a specific bank.
- **IMPORTANT**: If the user is ONLY asking for information (chat) and NOT for eligibility/offers, set "hideCard": true in the action data.
- **DYNAMIC SUGGESTIONS**: Generate 3-4 short, clickable questions (max 40 chars each) that the user might want to ask next based on their interest. If they show interest in a bank, include suggestions like "Repayment policy of [Bank]", "Preclosure charges of [Bank]", etc.

Task: Respond in JSON: {"text": "1-2 sentence advice", "suggestions": ["suggestion1", "suggestion2", ...], "action": {"type": "...", "data": {"bankIds": ["id1", "id2", ...], "requestedAmount": ${tempAmount}, "requestedSalary": ${tempSalary}, "requestedCibil": ${tempCibil}, "requestedTenure": ${tempTenure}, "requestedRate": ${tempRate}, "showMax": true/false, "hideCard": true/false}}}
- If the user specifies a DIFFERENT loan amount, salary, CIBIL, or tenure in their message, extract it as "requestedAmount", "requestedSalary", "requestedCibil", or "requestedTenure" in the data object.
- Suggestions should be relevant to the user's current query and profile.
- If the user asks to compare policies across multiple banks, ask them which specific banks they want to compare (e.g., "HDFC and ICICI").
`;

  try {
    const ai = getAI();
    
    // DEBUG: Log input to Gemini
    console.log('🔵 GEMINI INPUT - User Message:', lastMsg);
    console.log('🔵 GEMINI INPUT - Banks Being Sent (finalOffers):', finalOffers.map(o => ({ name: o.bankName, rate: o.minInterestRate, score: o.score })));
    console.log('🔵 GEMINI INPUT - Calculation cache size:', calculationCache.size);
    
    // Measure API call time
    const apiStartTime = performance.now();
    
    // 🎯 OPTIMIZED: Move verbose rules to system prompt
    // Why? Rules don't change per request, so send once server-side instead of 3000+ tokens per request
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });
    
    const apiEndTime = performance.now();
    const apiDuration = apiEndTime - apiStartTime;

    // DEBUG: Log raw response from Gemini
    console.log('🟡 GEMINI RAW RESPONSE:', response.text);
    
    const result = JSON.parse(response.text || '{}');
    
    // DEBUG: Log parsed response
    console.log('🟢 GEMINI PARSED RESPONSE:', {
      text: result.text?.substring(0, 100) + '...',
      suggestions: result.suggestions,
      actionType: result.action?.type,
      actionData: result.action?.data
    });
    
    // 📊 TOKEN USAGE TRACKING: Extract and log token usage
    const tokensUsed = {
      input: response.usageMetadata?.promptTokenCount || 0,
      output: response.usageMetadata?.candidatesTokenCount || 0
    };
    
    // Update session token count
    totalTokensUsed.input += tokensUsed.input;
    totalTokensUsed.output += tokensUsed.output;
    totalTokensUsed.requests += 1;
    
    // Calculate total request time
    const requestEndTime = performance.now();
    const totalRequestTime = requestEndTime - requestStartTime;
    
    // Update performance metrics
    requestTimings.apiTime += apiDuration;
    requestTimings.totalTime += totalRequestTime;
    requestTimings.requestCount += 1;
    requestTimings.times.push({ timestamp: Date.now(), duration: totalRequestTime, type: 'api' });
    
    // Calculate average metrics
    const avgTokensPerRequest = Math.round(totalTokensUsed.input / totalTokensUsed.requests);
    const estimatedCostCents = ((tokensUsed.input / 1000) * 0.075 + (tokensUsed.output / 1000) * 0.3) * 100; // Gemini pricing
    
    // 🎯 COMPREHENSIVE PERFORMANCE LOG
    console.log('\n' + '='.repeat(80));
    console.log('📊 REQUEST PERFORMANCE SUMMARY');
    console.log('='.repeat(80));
    console.log(`⏱️  API TIME: ${(apiDuration / 1000).toFixed(2)}s`);
    console.log(`⏱️  TOTAL TIME: ${(totalRequestTime / 1000).toFixed(2)}s`);
    console.log(`💰 TOKENS (This): Input=${tokensUsed.input} | Output=${tokensUsed.output} | Total=${tokensUsed.input + tokensUsed.output}`);
    console.log(`💰 TOKENS (Session): Total Input=${totalTokensUsed.input} | Output=${totalTokensUsed.output} | Requests=${totalTokensUsed.requests}`);
    console.log(`💵 COST (This Request): $${(estimatedCostCents / 100).toFixed(4)}`);
    console.log(`📈 EFFICIENCY: Avg ${avgTokensPerRequest} tokens/req | Cache Hit Rate: ${requestTimings.cacheHits}/${requestTimings.requestCount} (${Math.round((requestTimings.cacheHits / requestTimings.requestCount) * 100)}%)`);
    console.log('='.repeat(80) + '\n');
    
    const aiRes = { 
      text: result.text || "I've processed your request.", 
      suggestions: result.suggestions || [],
      action: result.action,
      tokensUsed: tokensUsed,
      timeTaken: { apiMs: Math.round(apiDuration), totalMs: Math.round(totalRequestTime) }
    };
    
    // Save to cache with token and timing metadata
    localCache.set(messageHash, {
      response: aiRes,
      timestamp: Date.now(),
      tokens: tokensUsed
    });
    
    return aiRes;
  } catch (error) {
    const errorTime = performance.now() - requestStartTime;
    console.error("❌ AI Error:", error);
    console.error(`⏱️  ERROR TIME: ${(errorTime / 1000).toFixed(2)}s`);
    const key = getGeminiApiKey();
    if (!key) {
      return { text: "I'm sorry, but the AI service is not configured. Please ensure your .env file has GEMINI_API_KEY and you have restarted your dev server.", timeTaken: { totalMs: Math.round(errorTime) } };
    }
    return { text: "I'm here to help! Could you please repeat that?", timeTaken: { totalMs: Math.round(errorTime) } };
  }
}
