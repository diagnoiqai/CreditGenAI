/**
 * Performance Metrics Utility
 * Display token usage + timing in one unified, clear format
 */

import { getTokenUsageStats, getPerformanceStats } from '../services/geminiService';

export interface RequestMetrics {
  timeMs: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cache: 'HIT' | 'MISS';
  estimatedCost: string;
}

/**
 * Format a single request's metrics for display
 * Shows: Time | Tokens | Type | Cost
 */
export function formatRequestMetrics(timeMs: number, inputTokens: number, outputTokens: number, isCacheHit: boolean = false): string {
  const totalTokens = inputTokens + outputTokens;
  const estimatedCost = ((inputTokens / 1000) * 0.075 + (outputTokens / 1000) * 0.3).toFixed(4);
  
  let timeDisplay: string;
  let timeEmoji: string;
  
  if (timeMs < 100) {
    timeEmoji = '⚡';
    timeDisplay = `${(timeMs / 1000).toFixed(3)}s`;
  } else if (timeMs < 1000) {
    timeEmoji = '🟢';
    timeDisplay = `${(timeMs / 1000).toFixed(2)}s`;
  } else if (timeMs < 2000) {
    timeEmoji = '🟡';
    timeDisplay = `${(timeMs / 1000).toFixed(2)}s`;
  } else {
    timeEmoji = '🔴';
    timeDisplay = `${(timeMs / 1000).toFixed(2)}s`;
  }
  
  let tokenDisplay: string;
  if (totalTokens < 1000) {
    tokenDisplay = `${totalTokens}`;
  } else {
    tokenDisplay = `${(totalTokens / 1000).toFixed(1)}K`;
  }
  
  const cacheDisplay = isCacheHit ? '💾 CACHE' : '🔄 NEW';
  
  return `${timeEmoji} ${timeDisplay} | 📊 ${inputTokens.toLocaleString()}↓ + ${outputTokens.toLocaleString()}↑ = ${tokenDisplay} | ${cacheDisplay} | 💵 $${estimatedCost}`;
}

/**
 * Format session summary showing overall performance
 */
export function formatSessionSummary(): string {
  const tokenStats = getTokenUsageStats();
  const perfStats = getPerformanceStats();
  
  const avgCost = ((tokenStats.averageInputPerRequest / 1000) * 0.075 + (tokenStats.averageOutputPerRequest / 1000) * 0.3).toFixed(4);
  const cacheEfficiency = `${perfStats.cacheHitRate}% hit rate (${perfStats.cacheHits}/${perfStats.totalRequests})`;
  
  return `
📈 SESSION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Requests: ${perfStats.totalRequests} | Avg Time: ${(perfStats.averageRequestTime / 1000).toFixed(2)}s | API Avg: ${(perfStats.averageApiTime / 1000).toFixed(2)}s
📊 Tokens: Total ${tokenStats.totalInput + tokenStats.totalOutput}K | Avg: ${tokenStats.averageInputPerRequest + tokenStats.averageOutputPerRequest}/req
💾 Cache: ${cacheEfficiency}
💵 Cost: Avg $${avgCost}/req | Total: $${((tokenStats.totalInput / 1000) * 0.075 + (tokenStats.totalOutput / 1000) * 0.3).toFixed(4)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

/**
 * Get color badge for performance (for UI rendering)
 */
export function getPerformanceBadge(timeMs: number): { emoji: string; label: string; color: string } {
  if (timeMs < 100) {
    return { emoji: '⚡', label: 'Cached', color: 'green' };
  } else if (timeMs < 1000) {
    return { emoji: '🟢', label: 'Fast', color: 'green' };
  } else if (timeMs < 2000) {
    return { emoji: '🟡', label: 'Normal', color: 'orange' };
  } else {
    return { emoji: '🔴', label: 'Slow', color: 'red' };
  }
}

/**
 * Get token efficiency rating
 */
export function getEfficiencyRating(tokens: number): { rating: string; color: string } {
  if (tokens < 3000) {
    return { rating: 'Excellent', color: 'green' };
  } else if (tokens < 5000) {
    return { rating: 'Good', color: 'yellow' };
  } else if (tokens < 7000) {
    return { rating: 'Fair', color: 'orange' };
  } else {
    return { rating: 'Poor', color: 'red' };
  }
}

/**
 * Get detailed metrics breakdown (for console/debug)
 */
export function getDetailedMetricsBreakdown(): string {
  const tokenStats = getTokenUsageStats();
  const perfStats = getPerformanceStats();
  
  const breakdown = `
╔════════════════════════════════════════════════════════╗
║  DETAILED PERFORMANCE METRICS                          ║
╚════════════════════════════════════════════════════════╝

📊 TOKEN USAGE
  ├─ Total Input: ${tokenStats.totalInput.toLocaleString()}
  ├─ Total Output: ${tokenStats.totalOutput.toLocaleString()}
  ├─ Total Tokens: ${(tokenStats.totalInput + tokenStats.totalOutput).toLocaleString()}
  ├─ Avg Per Request: ${tokenStats.averageInputPerRequest + tokenStats.averageOutputPerRequest}
  └─ Cost: $${((tokenStats.totalInput / 1000) * 0.075 + (tokenStats.totalOutput / 1000) * 0.3).toFixed(4)}

⏱️  TIMING PERFORMANCE
  ├─ Total Requests: ${perfStats.totalRequests}
  ├─ Avg Request Time: ${(perfStats.averageRequestTime / 1000).toFixed(2)}s
  ├─ Avg API Time: ${(perfStats.averageApiTime / 1000).toFixed(2)}s
  └─ Total API Time: ${((perfStats.averageApiTime * (perfStats.totalRequests - perfStats.cacheHits)) / 1000).toFixed(2)}s

💾 CACHE PERFORMANCE
  ├─ Cache Hits: ${perfStats.cacheHits}
  ├─ Cache Misses: ${perfStats.cacheMisses}
  ├─ Hit Rate: ${perfStats.cacheHitRate}%
  └─ Tokens Saved: ~${Math.round((tokenStats.averageInputPerRequest * perfStats.cacheHits) * 0.8).toLocaleString()}

🎯 RECENT REQUESTS (Last 10)
${perfStats.recentTimes.slice(-10).map((t, i) => `  ${i + 1}. ${new Date(t.timestamp).toLocaleTimeString()} | ${(t.duration / 1000).toFixed(2)}s | ${t.type.toUpperCase()}`).join('\n')}

📈 TARGET COMPARISON
  ├─ Initial (No Optimization): 8-12K tokens | 3-5 seconds ❌
  ├─ Phase 1 (Current): ${tokenStats.averageInputPerRequest + tokenStats.averageOutputPerRequest} tokens | ✅ Target
  ├─ Phase 2 Goal: 5-7.5K tokens | 0.5s perceived
  ├─ Phase 3 Goal: 2.5-3.5K tokens | 1-1.5s
  └─ Phase 4 Goal: <2.5K tokens | 1.5s
`;
  
  return breakdown;
}

/**
 * Log comprehensive metrics to console
 */
export function logComprehensiveMetrics(
  timeMs: number, 
  inputTokens: number, 
  outputTokens: number, 
  isCacheHit: boolean = false
): void {
  const singleRequest = formatRequestMetrics(timeMs, inputTokens, outputTokens, isCacheHit);
  const summary = formatSessionSummary();
  
  console.log('\n' + '═'.repeat(80));
  console.log('📊 REQUEST METRICS (Time in seconds)');
  console.log('═'.repeat(80));
  console.log(singleRequest);
  console.log(summary);
  console.log('═'.repeat(80) + '\n');
}

/**
 * Estimate cost in rupees (assuming 1 USD = 83 INR)
 */
export function estimateCostInINR(inputTokens: number, outputTokens: number): string {
  const usdCost = (inputTokens / 1000) * 0.075 + (outputTokens / 1000) * 0.3;
  const inrCost = usdCost * 83; // Approximate conversion
  
  if (inrCost < 1) {
    return `₹${(inrCost * 100).toFixed(0)} paise`;
  }
  return `₹${inrCost.toFixed(2)}`;
}

/**
 * Get quick status emoji
 */
export function getStatusEmoji(timeMs: number, isCacheHit: boolean): string {
  if (isCacheHit) return '💾';
  if (timeMs < 500) return '⚡';
  if (timeMs < 1000) return '🟢';
  if (timeMs < 2000) return '🟡';
  return '🔴';
}
