/**
 * Token Usage Display Utility
 * Use this to display token usage in your UI components
 */

export interface TokenUsage {
  input: number;
  output: number;
}

/**
 * Format token usage for display
 * @param tokens Token usage object with input and output
 * @returns Formatted string for display
 */
export function formatTokenUsage(tokens?: TokenUsage): string {
  if (!tokens) return '';
  const total = tokens.input + tokens.output;
  return `📊 ${tokens.input}↓ + ${tokens.output}↑ = ${total} tokens`;
}

/**
 * Get estimated cost (rough estimate based on Gemini pricing)
 * @param tokens Token usage object
 * @returns Estimated cost in dollars (rough estimate)
 */
export function estimateTokenCost(tokens?: TokenUsage): string {
  if (!tokens) return '';
  // Rough Gemini-3-flash pricing: ~0.0003 per 1M input, ~0.0006 per 1M output
  const inputCost = (tokens.input / 1000000) * 0.0003;
  const outputCost = (tokens.output / 1000000) * 0.0006;
  const total = inputCost + outputCost;
  return `~$${total.toFixed(6)}`;
}

/**
 * Get token usage status color (for UI indicators)
 * @param tokens Token usage object
 * @returns CSS class name for color coding
 */
export function getTokenUsageColor(tokens?: TokenUsage): 'green' | 'yellow' | 'red' {
  if (!tokens) return 'green';
  const total = tokens.input + tokens.output;
  if (total < 3000) return 'green'; // Efficient (cached or optimized)
  if (total < 5000) return 'yellow'; // Normal
  return 'red'; // High usage (new request)
}

/**
 * Get efficiency badge
 * @param tokens Token usage object
 * @returns Display string indicating efficiency
 */
export function getEfficiencyBadge(tokens?: TokenUsage): string {
  if (!tokens) return '';
  const total = tokens.input + tokens.output;
  if (total < 3000) return '⚡ Cached/Fast';
  if (total < 5000) return '✓ Normal';
  return '⏱️ Fresh Request';
}

// Example usage in React:
// <div style={{ color: getTokenUsageColor(response.tokensUsed) === 'green' ? 'green' : 'red' }}>
//   {formatTokenUsage(response.tokensUsed)}
// </div>
