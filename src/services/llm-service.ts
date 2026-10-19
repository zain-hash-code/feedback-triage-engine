import { LLMAnalysisOutput, LLMAnalysisOutputSchema } from "@/lib/types";
import { prepareInputForLLM } from "@/lib/security";

export interface LLMServiceOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  provider?: "mock" | "anthropic" | "openai";
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = "LLMError";
  }
}

/**
 * Heuristic classifier used for deterministic mock execution and offline testing.
 */
function mockClassifyFeedback(rawText: string): LLMAnalysisOutput {
  const lower = rawText.toLowerCase();

  let category: "bug" | "feature_request" | "billing" | "other" = "other";
  let urgency: "low" | "medium" | "high" | "critical" = "low";
  let sentiment: "positive" | "neutral" | "negative" = "neutral";

  // Category & Urgency heuristics
  if (
    lower.includes("bill") ||
    lower.includes("charge") ||
    lower.includes("refund") ||
    lower.includes("invoice") ||
    lower.includes("payment")
  ) {
    category = "billing";
    urgency = lower.includes("double") || lower.includes("asap") || lower.includes("urgent") ? "critical" : "high";
    sentiment = "negative";
  } else if (
    lower.includes("crash") ||
    lower.includes("broken") ||
    lower.includes("bug") ||
    lower.includes("error") ||
    lower.includes("fail") ||
    lower.includes("not working")
  ) {
    category = "bug";
    urgency = lower.includes("completely") || lower.includes("production") || lower.includes("blocker") ? "critical" : "high";
    sentiment = "negative";
  } else if (
    lower.includes("feature") ||
    lower.includes("would love") ||
    lower.includes("suggest") ||
    lower.includes("add") ||
    lower.includes("integrate")
  ) {
    category = "feature_request";
    urgency = "medium";
    sentiment = lower.includes("great") || lower.includes("love") ? "positive" : "neutral";
  } else if (
    lower.includes("great") ||
    lower.includes("awesome") ||
    lower.includes("love") ||
    lower.includes("fast") ||
    lower.includes("thank")
  ) {
    category = "other";
    urgency = "low";
    sentiment = "positive";
  }

  // Summary generation: concise sentence (max 100 words)
  const trimmed = rawText.trim();
  const summary =
    trimmed.length > 120 ? trimmed.slice(0, 117) + "..." : trimmed;

  // Calculate estimated tokens (~4 chars per token plus system overhead)
  const estimatedTokens = Math.max(45, Math.ceil(rawText.length / 4) + 65);

  return {
    category,
    urgency,
    summary,
    sentiment,
    tokens_consumed: estimatedTokens,
  };
}

/**
 * System prompt instructing LLMs to act as a strict classification agent.
 */
const SYSTEM_PROMPT = `You are an automated customer feedback triage assistant.
Analyze the user's feedback provided inside <user_feedback> tags.
Classify it into:
- category: "bug" | "feature_request" | "billing" | "other"
- urgency: "low" | "medium" | "high" | "critical"
- summary: A concise, objective summary of the issue or request (under 100 words)
- sentiment: "positive" | "neutral" | "negative"

Return ONLY a valid JSON object matching this schema, with no markdown code fences and no conversational filler:
{
  "category": "...",
  "urgency": "...",
  "summary": "...",
  "sentiment": "...",
  "tokens_consumed": <integer>
}`;

export class LLMService {
  private maxRetries: number;
  private initialDelayMs: number;
  private provider: string;

  constructor(options?: LLMServiceOptions) {
    this.maxRetries = options?.maxRetries ?? 3;
    this.initialDelayMs = options?.initialDelayMs ?? 300;
    this.provider =
      options?.provider ||
      process.env.LLM_PROVIDER ||
      (process.env.ANTHROPIC_API_KEY ? "anthropic" : process.env.OPENAI_API_KEY ? "openai" : "mock");
  }

  /**
   * Exponential backoff retry wrapper
   */
  async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        lastError = err;
        const statusCode = err?.statusCode || err?.status;
        const isRetryable =
          statusCode === 429 || (statusCode >= 500 && statusCode < 600) || err.code === "ECONNRESET";

        if (attempt === this.maxRetries || !isRetryable) {
          throw err;
        }

        // Exponential backoff with jitter
        const delay = this.initialDelayMs * Math.pow(2, attempt) + Math.random() * 100;
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw lastError;
  }

  /**
   * Main entrypoint to analyze feedback text.
   */
  async analyzeFeedback(rawText: string): Promise<LLMAnalysisOutput> {
    const sanitizedInput = prepareInputForLLM(rawText);

    return this.withRetry(async () => {
      let rawJsonString: string;

      if (this.provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
        rawJsonString = await this.callAnthropic(sanitizedInput);
      } else if (this.provider === "openai" && process.env.OPENAI_API_KEY) {
        rawJsonString = await this.callOpenAI(sanitizedInput);
      } else {
        // Mock provider
        const mockResult = mockClassifyFeedback(sanitizedInput);
        return mockResult;
      }

      // Parse and validate using Zod
      return this.parseAndValidate(rawJsonString);
    });
  }

  /**
   * Calls Anthropic Messages API
   */
  private async callAnthropic(sanitizedInput: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey || "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `<user_feedback>\n${sanitizedInput}\n</user_feedback>`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new LLMError(
        `Anthropic API error: ${response.statusText}`,
        response.status,
        response.status === 429 || response.status >= 500
      );
    }

    const data: any = await response.json();
    const content = data.content?.[0]?.text || "";
    const totalTokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    // Inject tokens_consumed if not provided by model
    try {
      const parsed = JSON.parse(content);
      if (!parsed.tokens_consumed) {
        parsed.tokens_consumed = totalTokens;
      }
      return JSON.stringify(parsed);
    } catch {
      return content;
    }
  }

  /**
   * Calls OpenAI Chat Completions API
   */
  private async callOpenAI(sanitizedInput: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `<user_feedback>\n${sanitizedInput}\n</user_feedback>` },
        ],
      }),
    });

    if (!response.ok) {
      throw new LLMError(
        `OpenAI API error: ${response.statusText}`,
        response.status,
        response.status === 429 || response.status >= 500
      );
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const totalTokens = data.usage?.total_tokens || 0;

    try {
      const parsed = JSON.parse(content);
      if (!parsed.tokens_consumed) {
        parsed.tokens_consumed = totalTokens;
      }
      return JSON.stringify(parsed);
    } catch {
      return content;
    }
  }

  /**
   * Strict validation of JSON output against Zod schema
   */
  parseAndValidate(rawOutput: string): LLMAnalysisOutput {
    let parsed: any;
    try {
      // Clean markdown code blocks if model wrapped the JSON
      const cleanJson = rawOutput
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleanJson);
    } catch (e: any) {
      throw new LLMError(`Failed to parse LLM response as JSON: ${e.message}`, 422, false);
    }

    const validationResult = LLMAnalysisOutputSchema.safeParse(parsed);
    if (!validationResult.success) {
      throw new LLMError(
        `LLM response schema validation failed: ${JSON.stringify(validationResult.error.format())}`,
        422,
        false
      );
    }

    return validationResult.data;
  }
}

export const llmService = new LLMService();
