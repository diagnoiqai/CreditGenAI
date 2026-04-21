/**
 * Metrics & Cache Tracker for Gemini AI Service
 * 
 * This service handles:
 * 1. Response caching (TTL-based)
 * 2. Calculation caching (Eligibility math)
 * 3. Token usage tracking
 * 4. Performance monitoring (API vs Cache timings)
 */

export const localCache = new Map<string, { response: any; timestamp: number; tokens: { input: number; output: number } }>();
export const calculationCache = new Map<string, number>();

// Session stats
let totalInputTokens = 0;
let totalOutputTokens = 0;
let totalRequests = 0;
let cacheHits = 0;
let cacheMisses = 0;
let totalApiTime = 0;
let totalRequestTime = 0;
const requestTimes: number[] = [];

export function clearAICache() {
  localCache.clear();
  calculationCache.clear();
  console.log('🧹 AI Cache & Calculations cleared.');
}

export function getAICacheData() {
  const cacheData: Record<string, any> = {};
  localCache.forEach((value, key) => {
    cacheData[key] = value;
  });
  return cacheData;
}

export function viewAICache() {
  const cacheData = getAICacheData();
  console.log('📦 AI CACHE CONTENTS:', cacheData);
  console.log(`📊 Total cached items: ${localCache.size}`);
  console.log(`🧮 Total cached calculations: ${calculationCache.size}`);
  return cacheData;
}

export function getTokenUsageStats() {
  return {
    totalInput: totalInputTokens,
    totalOutput: totalOutputTokens,
    totalRequests,
    averageInputPerRequest: totalRequests > 0 ? Math.round(totalInputTokens / totalRequests) : 0,
    averageOutputPerRequest: totalRequests > 0 ? Math.round(totalOutputTokens / totalRequests) : 0,
    cacheHitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0
  };
}

export function getPerformanceStats() {
  return {
    averageRequestTime: requestTimes.length > 0 ? Math.round(requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length) : 0,
    averageApiTime: (totalRequests - cacheHits) > 0 ? Math.round(totalApiTime / (totalRequests - cacheHits)) : 0,
    totalRequests,
    cacheHits,
    cacheMisses,
    cacheHitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
    recentTimes: requestTimes.slice(-10)
  };
}

export function recordCacheHit(timeMs: number) {
  cacheHits++;
  totalRequests++;
  requestTimes.push(timeMs);
}

export function recordCacheMiss() {
  cacheMisses++;
  totalRequests++;
}

export function recordTokenUsage(input: number, output: number) {
  totalInputTokens += input;
  totalOutputTokens += output;
}

export function recordAPITiming(apiDuration: number, totalDuration: number) {
  totalApiTime += apiDuration;
  totalRequestTime += totalDuration;
  requestTimes.push(totalDuration);
}

export function logPerformanceMetrics(apiDuration: number, totalDuration: number, inputTokens: number, outputTokens: number, isCache: boolean) {
  const type = isCache ? '🟢 CACHE' : '🔵 API';
  console.log(`📊 ${type} METRICS:`);
  console.log(`   - Total Time: ${totalDuration.toFixed(2)}ms`);
  if (!isCache) console.log(`   - API Time: ${apiDuration.toFixed(2)}ms`);
  console.log(`   - Tokens: ${inputTokens} in / ${outputTokens} out`);
  
  const stats = getTokenUsageStats();
  console.log(`📈 SESSION STATS: ${stats.totalRequests} reqs | ${stats.cacheHitRate.toFixed(1)}% hit rate | ${stats.totalInput + stats.totalOutput} total tokens`);
}

export function isCacheValid(timestamp: number, ttlMs: number): boolean {
  return Date.now() - timestamp < ttlMs;
}
