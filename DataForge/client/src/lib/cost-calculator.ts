export interface ModelPricing {
  inputTokenPrice: number; // Price per million tokens
  outputTokenPrice: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4o-mini': {
    inputTokenPrice: 0.150, // $0.150 per 1M input tokens
    outputTokenPrice: 0.600, // $0.600 per 1M output tokens
  },
  'gpt-4o': {
    inputTokenPrice: 5.00, // $5.00 per 1M input tokens
    outputTokenPrice: 15.00, // $15.00 per 1M output tokens
  },
  'gpt-3.5-turbo': {
    inputTokenPrice: 0.500, // $0.50 per 1M input tokens
    outputTokenPrice: 1.500, // $1.50 per 1M output tokens
  },
};

export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    throw new Error(`Unknown model: ${model}`);
  }

  const inputCost = (inputTokens / 1000000) * pricing.inputTokenPrice;
  const outputCost = (outputTokens / 1000000) * pricing.outputTokenPrice;
  
  return inputCost + outputCost;
}

export function estimatePromptTokens(
  prompt: string,
  selectedColumns: string[],
  sampleData: Record<string, any>
): number {
  // Replace placeholders with sample data
  let processedPrompt = prompt;
  selectedColumns.forEach(column => {
    const placeholder = `{${column}}`;
    const value = String(sampleData[column] || '');
    processedPrompt = processedPrompt.replaceAll(placeholder, value);
  });

  // Add system message tokens
  const systemMessage = "You are a data enrichment assistant. Provide accurate, concise responses based on the given information.";
  
  return estimateTokens(processedPrompt + systemMessage);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}
