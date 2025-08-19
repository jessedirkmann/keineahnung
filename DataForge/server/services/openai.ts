import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o-mini" which was released after the knowledge cutoff. do not change this unless explicitly requested by the user
export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  async enrichRow(
    rowData: Record<string, any>,
    prompt: string,
    selectedColumns: string[],
    targetColumns: string[],
    model: string = "gpt-4o-mini"
  ): Promise<{ results: Record<string, string>; tokensUsed: number }> {
    try {
      // Replace placeholders in prompt with actual data
      let processedPrompt = prompt;
      selectedColumns.forEach(column => {
        const placeholder = `{${column}}`;
        const value = rowData[column] || '';
        processedPrompt = processedPrompt.replaceAll(placeholder, value);
      });

      // Add all available business information for better context
      const businessContext = Object.entries(rowData)
        .filter(([key, value]) => value && typeof value === 'string' && value.trim())
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      processedPrompt += `\n\nVerfügbare Geschäftsinformationen:\n${businessContext}`;

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `You are a data enrichment assistant. Based on the provided business information, extract and infer the requested contact details: ${targetColumns.join(', ')}.

Use the following rules:
1. For German businesses, use "Herr" or "Frau" for Anrede based on the name
2. Extract names from business names, addresses, or phone directory information
3. Generate professional email addresses using common patterns: firstname.lastname@domain.com, info@domain.com, kontakt@domain.com
4. Use the provided website domain for email addresses
5. Make reasonable inferences based on the business context

Respond with a valid JSON object containing only the target column names as keys and their enriched values. 
Example: {"Anrede": "Frau", "Vorname": "Andrea", "Nachname": "Müller", "Email": "andrea.mueller@example.de"}

Always provide reasonable values based on the available information. Do not leave fields empty unless absolutely no information is available.`
          },
          {
            role: "user",
            content: processedPrompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
        temperature: 0.1,
      });

      const resultContent = response.choices[0].message.content || '{}';
      const tokensUsed = response.usage?.total_tokens || 0;
      
      console.log(`OpenAI Raw Response: ${resultContent}`);
      
      try {
        const results = JSON.parse(resultContent);
        console.log(`Parsed OpenAI results:`, results);
        
        // Ensure all target columns are present
        const finalResults: Record<string, string> = {};
        targetColumns.forEach(col => {
          finalResults[col] = results[col] || '';
        });
        
        console.log(`Final processed results:`, finalResults);
        return { results: finalResults, tokensUsed };
      } catch (error) {
        console.error(`JSON parsing failed for OpenAI response: ${resultContent}`, error);
        // Fallback: create empty results if JSON parsing fails
        const emptyResults: Record<string, string> = {};
        targetColumns.forEach(col => {
          emptyResults[col] = '';
        });
        return { results: emptyResults, tokensUsed };
      }
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async webSearch(query: string): Promise<string> {
    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o-mini",
        input: [{ role: "user", content: query }],
        tools: [{ type: "web_search_preview" }]
      });
      return response.output_text || "";
    } catch (error) {
      throw new Error(`OpenAI web search error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  calculateCost(tokens: number, model: string = "gpt-4o-mini"): number {
    // Pricing per 1M tokens for gpt-4o-mini
    const pricePerMillionTokens = 0.150; // $0.150 per 1M input tokens
    return (tokens / 1000000) * pricePerMillionTokens;
  }

  estimateTokens(prompt: string, selectedColumns: string[], sampleData: Record<string, any>): number {
    // Replace placeholders with sample data to estimate token count
    let processedPrompt = prompt;
    selectedColumns.forEach(column => {
      const placeholder = `{${column}}`;
      const value = sampleData[column] || '';
      processedPrompt = processedPrompt.replaceAll(placeholder, value);
    });

    // Rough estimation: ~4 characters per token
    return Math.ceil(processedPrompt.length / 4) + 100; // Add buffer for system message and response
  }
}
