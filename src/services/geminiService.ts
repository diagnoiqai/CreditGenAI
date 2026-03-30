import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile, ChatMessage, BankOffer } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const localCache = new Map<string, any>();

export function clearAICache() {
  localCache.clear();
  console.log('INFO: AI Cache cleared.');
}

export async function getAIResponse(messages: ChatMessage[], profile: UserProfile, bankOffers: BankOffer[]): Promise<{ text: string, action?: any, suggestions?: string[] }> {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const cacheKey = `v5_${lastMsg.toLowerCase().trim()}_${profile.monthlyIncome}_${profile.existingEMIs || 0}`;

  if (localCache.has(cacheKey)) return localCache.get(cacheKey);

  // Keyword filter and sorting to keep prompt tiny
  const kw = lastMsg.toLowerCase();
  
  // Dynamic extraction for scoring based on chat context
  let tempSalary = profile.monthlyIncome || 0;
  let tempAmount = profile.loanAmountRequired || 0;
  let tempCibil = profile.cibilScore || 0;
  let tempTenure = 0; // Tenure in years

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

  // Detect if user is asking about policies
  const isPolicyQuery = kw.includes('policy') || kw.includes('preclosure') || kw.includes('charges') || kw.includes('terms') || kw.includes('condition');
  const mentionedBank = bankOffers.find(o => kw.includes(o.bankName.toLowerCase()));

  let sortedOffers = [...bankOffers];

  const isHighest = kw.includes('highest') || kw.includes('max') || kw.includes('most');
  const isLowest = kw.includes('lowest') || kw.includes('min') || kw.includes('least') || kw.includes('cheap');
  const isBest = kw.includes('best') || kw.includes('top') || kw.includes('recommend') || kw.includes('match');
  const requiredAmount = tempAmount;

  const calculateMaxEligibleLoan = (offer: BankOffer) => {
    const income = tempSalary;
    const emis = profile.existingEMIs || 0;
    const isLowCibil = tempCibil && tempCibil < 750;
    const rate = (isLowCibil && offer.interestRateBelow750) ? offer.interestRateBelow750 : offer.minInterestRate;
    const bankMax = (isLowCibil && offer.maxAmountPercentBelow750) ? (offer.maxAmount * offer.maxAmountPercentBelow750 / 100) : offer.maxAmount;
    
    const foir = 0.5; // 50% FOIR
    const availableEMI = (income * foir) - emis;
    if (availableEMI <= 0) return 0;

    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) return bankMax;

    const tenure = offer.maxTenure;
    const maxLoan = availableEMI * ((1 - Math.pow(1 + monthlyRate, -tenure)) / monthlyRate);
    return Math.min(Math.round(maxLoan), bankMax);
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
  let finalOffers: any[] = [];
  
  if (isBest) {
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

  console.log(`DEBUG: Found ${finalOffers.length} offers for prompt. Top score: ${finalOffers[0]?.score}`);
  
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

Rules:
- Use action type "ELIGIBILITY_SUMMARY" for eligibility/amount queries.
- Use action type "COMPARE_OFFERS" for comparison/finding offers.
- Use action type "CALCULATE_EMI" for EMI queries.
- Use action type "SEARCH_POLICIES" if the user asks about repayment, preclosure, or terms.
- CRITICAL: When comparing two or more banks, ALWAYS use a SINGLE "COMPARE_OFFERS" action with all relevant bank IDs in the "bankIds" array. DO NOT return multiple actions or messages for comparison.
- CRITICAL: The "Offers" list is already sorted by a robust scoring engine. The first bank is the mathematically "Best Match".
- If a bank has a higher rate but is ranked higher, explain why (e.g. "Only bank where you meet the minimum CIBIL requirement").
- If the user asks about a specific bank like "Fullerton", and it's in the list, explain its eligibility based on the dynamic CIBIL ${tempCibil}.
- If the user asks for more than they are eligible for, tell them the maximum they can get based on their income (usually 10-15x monthly income).
- Provide specific details like repayment policy, preclosure charges, and terms & conditions if the user asks about a specific bank.
- **IMPORTANT**: If the user is ONLY asking for information (chat) and NOT for eligibility/offers, set "hideCard": true in the action data.
- **DYNAMIC SUGGESTIONS**: Generate 3-4 short, clickable questions (max 40 chars each) that the user might want to ask next based on their interest. If they show interest in a bank, include suggestions like "Repayment policy of [Bank]", "Preclosure charges of [Bank]", etc.

Task: Respond in JSON: {"text": "1-2 sentence advice", "suggestions": ["suggestion1", "suggestion2", ...], "action": {"type": "...", "data": {"bankIds": ["id1", "id2", ...], "requestedAmount": ${tempAmount}, "requestedSalary": ${tempSalary}, "requestedCibil": ${tempCibil}, "requestedTenure": ${tempTenure}, "showMax": true/false, "hideCard": true/false}}}
- If the user specifies a DIFFERENT loan amount, salary, CIBIL, or tenure in their message, extract it as "requestedAmount", "requestedSalary", "requestedCibil", or "requestedTenure" in the data object.
- Suggestions should be relevant to the user's current query and profile.
- If the user asks to compare policies across multiple banks, ask them which specific banks they want to compare (e.g., "HDFC and ICICI").
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || '{}');
    const aiRes = { 
      text: result.text || "I've processed your request.", 
      suggestions: result.suggestions || [],
      action: result.action 
    };
    
    localCache.set(cacheKey, aiRes);
    
    return aiRes;
  } catch (error) {
    console.error("AI Error:", error);
    return { text: "I'm here to help! Could you please repeat that?" };
  }
}
