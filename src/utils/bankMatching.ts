import { BankOffer } from '../types';
import Fuse from 'fuse.js';

/**
 * Bank Matching Configuration
 * Controls the behavior of the hybrid bank name matching system
 */
export const BANK_MATCHING_CONFIG = {
  FUSE_THRESHOLD: 0.4,        // 0-1: how strict (0=very fuzzy, 1=exact). Default matches typos up to 1-2 chars
  LEVENSHTEIN_MAX_DISTANCE: 2, // Max character edits allowed (e.g., "hdfc" vs "hdf" = 1 edit)
  CACHE_ENABLED: true,         // Cache results?
  CACHE_TTL_MS: 3600000,       // 1 hour
};

/**
 * Cache for bank name matches to reduce computation
 */
const bankMatchCache = new Map<string, { result: BankOffer | null; timestamp: number }>();

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of character edits needed to transform one string into another
 *
 * @param str1 First string
 * @param str2 Second string
 * @returns Levenshtein distance (lower = more similar)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,      // deletion
        matrix[j - 1][i] + 1,      // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return matrix[str2.length][str1.length];
}

/**
 * TIER 1: Exact match (includes aliases)
 * Fastest, most accurate. Returns match if user input exactly matches bank name or any alias.
 *
 * @param userInput User's text input
 * @param banks Array of available bank offers
 * @returns Matching bank or null
 */
export function findBankExactMatch(userInput: string, banks: BankOffer[]): BankOffer | null {
  const normalized = userInput.toLowerCase().trim();

  // First try exact match
  let match = banks.find(
    (o) =>
      o.bankName.toLowerCase() === normalized ||
      (o.aliases || []).some((a) => a.toLowerCase() === normalized)
  );
  
  if (match) return match;
  
  // Then try contains match for short keywords (single word like "icici", "hdfc")
  if (normalized.split(/\s+/).length === 1) {
    match = banks.find((o) => 
      o.bankName.toLowerCase().includes(normalized) ||
      (o.aliases || []).some((a) => a.toLowerCase().includes(normalized))
    );
  }
  
  return match || null;
}

/**
 * TIER 2: Fuzzy match using Fuse.js
 * Handles typos and partial matches. Requires fuse.js library.
 * This is a standalone implementation if Fuse.js isn't available.
 *
 * @param userInput User's text input
 * @param banks Array of available bank offers
 * @param threshold Fuse.js threshold (0-1, lower = more fuzzy)
 * @returns Matching bank or null
 */
export function findBankFuzzyMatch(
  userInput: string,
  banks: BankOffer[],
  threshold: number = BANK_MATCHING_CONFIG.FUSE_THRESHOLD
): BankOffer | null {
  const normalized = userInput.toLowerCase().trim();

  // Use Fuse.js for fuzzy matching
  const bankData = banks.map((b) => ({
    id: b.id,
    searchText: [b.bankName, ...(b.aliases || [])].join(' '),
  }));

  const fuse = new Fuse(bankData, {
    keys: ['searchText'],
    threshold: threshold,
    distance: 100,
    minMatchCharLength: 2,
  });

  const results = fuse.search(userInput);
  if (results.length > 0) {
    return banks.find((b) => b.id === results[0].item.id) || null;
  }

  return null;
}

/**
 * TIER 3: Levenshtein distance matching
 * Handles phonetic typos. Allows up to N character edits.
 *
 * @param userInput User's text input
 * @param banks Array of available bank offers
 * @param maxDistance Maximum character edit distance allowed
 * @returns Matching bank or null if no close match found
 */
export function findBankByDistance(
  userInput: string,
  banks: BankOffer[],
  maxDistance: number = BANK_MATCHING_CONFIG.LEVENSHTEIN_MAX_DISTANCE
): BankOffer | null {
  const normalized = userInput.toLowerCase().trim();

  let bestMatch: { bank: BankOffer; distance: number } | null = null;

  for (const bank of banks) {
    // Check against bank name
    const bankNameDistance = levenshteinDistance(normalized, bank.bankName.toLowerCase());

    if (bankNameDistance <= maxDistance) {
      if (!bestMatch || bankNameDistance < bestMatch.distance) {
        bestMatch = { bank, distance: bankNameDistance };
      }
    }

    // Check against aliases
    if (bank.aliases) {
      for (const alias of bank.aliases) {
        const aliasDistance = levenshteinDistance(normalized, alias.toLowerCase());
        if (aliasDistance <= maxDistance) {
          if (!bestMatch || aliasDistance < bestMatch.distance) {
            bestMatch = { bank, distance: aliasDistance };
          }
        }
      }
    }
  }

  return bestMatch?.bank || null;
}

/**
 * Get cached bank match result
 * Returns cached result if found and not expired
 *
 * @param query Search query
 * @returns Cached result or undefined if not found/expired
 */
function getCachedMatch(query: string): BankOffer | null | undefined {
  if (!BANK_MATCHING_CONFIG.CACHE_ENABLED) return undefined;

  const cached = bankMatchCache.get(query.toLowerCase());
  if (cached && Date.now() - cached.timestamp < BANK_MATCHING_CONFIG.CACHE_TTL_MS) {
    console.log(`[BankMatch] Cache HIT for: "${query}"`);
    return cached.result;
  }

  if (cached) {
    bankMatchCache.delete(query.toLowerCase());
  }
  return undefined;
}

/**
 * Cache bank match result
 * Stores result with timestamp for TTL-based expiration
 *
 * @param query Search query
 * @param result Matching bank or null
 */
function setCachedMatch(query: string, result: BankOffer | null): void {
  if (!BANK_MATCHING_CONFIG.CACHE_ENABLED) return;

  bankMatchCache.set(query.toLowerCase(), {
    result,
    timestamp: Date.now(),
  });
  console.log(`[BankMatch] Cache SET for: "${query}"`);
}

/**
 * HYBRID BANK MATCHING - Main function
 * Uses 3-tier fallback system:
 * 1. Exact match (Tier 1)
 * 2. Fuzzy match with Fuse.js (Tier 2)
 * 3. Levenshtein distance matching (Tier 3)
 *
 * @param userInput User's bank name search
 * @param banks Array of available bank offers
 * @returns Matching bank or null if no match found
 */
export function findBestBankMatch(userInput: string, banks: BankOffer[]): BankOffer | null {
  if (!userInput || !userInput.trim()) {
    return null;
  }

  // Check cache first
  const cached = getCachedMatch(userInput);
  if (cached !== undefined) {
    return cached;
  }

  let match: BankOffer | null = null;
  let tier = 0;

  // TIER 1: Exact Match (fastest, most accurate)
  console.log(`[BankMatch] Tier 1 (Exact): Searching for "${userInput}"`);
  match = findBankExactMatch(userInput, banks);
  if (match) {
    console.log(`[BankMatch] ✓ Tier 1 match found: ${match.bankName}`);
    tier = 1;
    setCachedMatch(userInput, match);
    return match;
  }

  // TIER 2: Fuzzy Match (handles typos)
  console.log(`[BankMatch] Tier 2 (Fuzzy): Searching for "${userInput}"`);
  match = findBankFuzzyMatch(userInput, banks);
  if (match) {
    console.log(`[BankMatch] ✓ Tier 2 match found: ${match.bankName}`);
    tier = 2;
    setCachedMatch(userInput, match);
    return match;
  }

  // TIER 3: Levenshtein Distance (fallback for phonetic typos)
  console.log(`[BankMatch] Tier 3 (LevenDistance): Searching for "${userInput}"`);
  match = findBankByDistance(userInput, banks);
  if (match) {
    console.log(`[BankMatch] ✓ Tier 3 match found: ${match.bankName}`);
    tier = 3;
    setCachedMatch(userInput, match);
    return match;
  }

  // TIER 4: No match found
  console.log(`[BankMatch] ✗ Tier 4: No match found for "${userInput}"`);
  setCachedMatch(userInput, null);
  return null;
}

/**
 * Clear the bank matching cache
 * Useful when bank offers are updated
 */
export function clearBankMatchCache(): void {
  bankMatchCache.clear();
  console.log('[BankMatch] Cache cleared');
}

/**
 * Get all banks similar to user input
 * Returns array of banks sorted by relevance
 * Useful for disambiguation UI
 *
 * @param userInput User's search text
 * @param banks Array of available banks
 * @param maxResults Maximum number of results to return
 * @returns Array of banks sorted by relevance (best first)
 */
export function findSimilarBanks(
  userInput: string,
  banks: BankOffer[],
  maxResults: number = 5
): BankOffer[] {
  const normalized = userInput.toLowerCase().trim();
  const scored: Array<{ bank: BankOffer; score: number }> = [];

  for (const bank of banks) {
    let score = 0;

    // Exact match gets highest score
    if (bank.bankName.toLowerCase() === normalized) {
      score = 1000;
    }

    // Alias match
    if ((bank.aliases || []).some((a) => a.toLowerCase() === normalized)) {
      score = 900;
    }

    // Substring match
    if (bank.bankName.toLowerCase().includes(normalized)) {
      score = 800 - levenshteinDistance(normalized, bank.bankName.toLowerCase());
    }

    // Alias substring match
    for (const alias of bank.aliases || []) {
      if (alias.toLowerCase().includes(normalized)) {
        const distance = levenshteinDistance(normalized, alias.toLowerCase());
        score = Math.max(score, 700 - distance);
      }
    }

    // Levenshtein distance
    const distance = levenshteinDistance(normalized, bank.bankName.toLowerCase());
    if (distance <= 3) {
      score = Math.max(score, 500 - distance * 50);
    }

    if (score > 0) {
      scored.push({ bank, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.bank);
}
