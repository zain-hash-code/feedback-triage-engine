import { z } from "zod";

export const FeedbackSourceSchema = z.enum(["web", "email", "api"]);
export type FeedbackSource = z.infer<typeof FeedbackSourceSchema>;

export const FeedbackCategorySchema = z.enum([
  "bug",
  "feature_request",
  "billing",
  "other",
]);
export type FeedbackCategory = z.infer<typeof FeedbackCategorySchema>;

export const FeedbackUrgencySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);
export type FeedbackUrgency = z.infer<typeof FeedbackUrgencySchema>;

export const FeedbackSentimentSchema = z.enum([
  "positive",
  "neutral",
  "negative",
]);
export type FeedbackSentiment = z.infer<typeof FeedbackSentimentSchema>;

export const CreateFeedbackInputSchema = z.object({
  raw_text: z
    .string()
    .min(3, "Feedback text must be at least 3 characters")
    .max(5000, "Feedback text must not exceed 5000 characters"),
  source: FeedbackSourceSchema.default("web"),
});
export type CreateFeedbackInput = z.infer<typeof CreateFeedbackInputSchema>;

export const LLMAnalysisOutputSchema = z.object({
  category: FeedbackCategorySchema,
  urgency: FeedbackUrgencySchema,
  summary: z.string().min(1).max(300),
  sentiment: FeedbackSentimentSchema,
  tokens_consumed: z.number().int().nonnegative(),
});
export type LLMAnalysisOutput = z.infer<typeof LLMAnalysisOutputSchema>;

export interface TenantUsageSummary {
  id: string;
  name: string;
  monthly_token_budget: number;
  tokens_used: number;
  tokens_remaining: number;
  percentage_used: number;
  status: "normal" | "warning_80" | "exceeded_100";
}
