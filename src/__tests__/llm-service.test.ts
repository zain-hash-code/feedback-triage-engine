import { describe, it, expect, vi } from "vitest";
import { LLMService, LLMError } from "@/services/llm-service";

describe("LLMService Unit Tests", () => {
  const service = new LLMService({ maxRetries: 2, initialDelayMs: 10, provider: "mock" });

  describe("parseAndValidate", () => {
    it("successfully parses valid structured JSON output", () => {
      const validJson = JSON.stringify({
        category: "bug",
        urgency: "high",
        summary: "Database connection failed during export.",
        sentiment: "negative",
        tokens_consumed: 120,
      });

      const parsed = service.parseAndValidate(validJson);
      expect(parsed.category).toBe("bug");
      expect(parsed.urgency).toBe("high");
      expect(parsed.summary).toBe("Database connection failed during export.");
      expect(parsed.tokens_consumed).toBe(120);
    });

    it("parses JSON enclosed in markdown code fences", () => {
      const fencedJson = "```json\n" + JSON.stringify({
        category: "feature_request",
        urgency: "medium",
        summary: "Add export to PDF feature.",
        sentiment: "positive",
        tokens_consumed: 90,
      }) + "\n```";

      const parsed = service.parseAndValidate(fencedJson);
      expect(parsed.category).toBe("feature_request");
      expect(parsed.tokens_consumed).toBe(90);
    });

    it("throws LLMError when response is not valid JSON", () => {
      const malformed = "I am an AI and here is your analysis: {broken json";
      expect(() => service.parseAndValidate(malformed)).toThrow(LLMError);
    });

    it("throws LLMError when schema validation fails (unknown enum value)", () => {
      const invalidCategory = JSON.stringify({
        category: "unrecognized_category",
        urgency: "high",
        summary: "Some issue",
        sentiment: "neutral",
        tokens_consumed: 50,
      });

      expect(() => service.parseAndValidate(invalidCategory)).toThrow(LLMError);
    });

    it("throws LLMError when tokens_consumed is negative", () => {
      const negativeTokens = JSON.stringify({
        category: "billing",
        urgency: "critical",
        summary: "Refund issue",
        sentiment: "negative",
        tokens_consumed: -50,
      });

      expect(() => service.parseAndValidate(negativeTokens)).toThrow(LLMError);
    });
  });

  describe("withRetry exponential backoff", () => {
    it("retries on retryable 429 status code and succeeds on subsequent attempt", async () => {
      let attempts = 0;
      const mockOperation = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new LLMError("Rate limit exceeded", 429, true);
        }
        return { success: true };
      });

      const result = await service.withRetry(mockOperation);
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it("does not retry on non-retryable 400 Bad Request error", async () => {
      let attempts = 0;
      const mockOperation = vi.fn().mockImplementation(async () => {
        attempts++;
        throw new LLMError("Bad request", 400, false);
      });

      await expect(service.withRetry(mockOperation)).rejects.toThrow("Bad request");
      expect(attempts).toBe(1);
    });

    it("exhausts max retries and bubbles up the error", async () => {
      let attempts = 0;
      const mockOperation = vi.fn().mockImplementation(async () => {
        attempts++;
        throw new LLMError("Internal LLM service crash", 500, true);
      });

      await expect(service.withRetry(mockOperation)).rejects.toThrow("Internal LLM service crash");
      expect(attempts).toBe(3); // Initial + 2 retries
    });
  });

  describe("analyzeFeedback Mock/Offline Provider", () => {
    it("correctly identifies billing critical urgency from keywords", async () => {
      const result = await service.analyzeFeedback("We were double-billed on our invoice! Please refund ASAP!");
      expect(result.category).toBe("billing");
      expect(result.urgency).toBe("critical");
      expect(result.sentiment).toBe("negative");
      expect(result.tokens_consumed).toBeGreaterThan(0);
    });

    it("correctly identifies bug high urgency from broken functionality", async () => {
      const result = await service.analyzeFeedback("The application crashes whenever I open the analytics tab.");
      expect(result.category).toBe("bug");
      expect(result.urgency).toBe("high");
      expect(result.sentiment).toBe("negative");
    });

    it("correctly identifies feature request from user suggestion", async () => {
      const result = await service.analyzeFeedback("Would love if you could add a dark mode toggle to the dashboard.");
      expect(result.category).toBe("feature_request");
      expect(result.urgency).toBe("medium");
    });
  });
});
