import { z } from "zod";

export const FeedbackSourceSchema = z.enum([
  "web",
  "email",
  "api",
  "intercom",
  "zendesk",
  "stripe",
]);
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

export const ResolutionStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "dismissed",
]);
export type ResolutionStatus = z.infer<typeof ResolutionStatusSchema>;

export const CreateFeedbackInputSchema = z.object({
  raw_text: z
    .string()
    .min(3, "Feedback text must be at least 3 characters")
    .max(5000, "Feedback text must not exceed 5000 characters"),
  source: FeedbackSourceSchema.default("web"),
  assigned_to: z.string().optional(),
});
export type CreateFeedbackInput = z.infer<typeof CreateFeedbackInputSchema>;

export const UpdateFeedbackInputSchema = z.object({
  resolution_status: ResolutionStatusSchema.optional(),
  assigned_to: z.string().optional(),
  internal_notes: z.string().optional(),
});
export type UpdateFeedbackInput = z.infer<typeof UpdateFeedbackInputSchema>;

export const LLMAnalysisOutputSchema = z.object({
  category: FeedbackCategorySchema,
  urgency: FeedbackUrgencySchema,
  summary: z.string().min(1).max(300),
  sentiment: FeedbackSentimentSchema,
  suggested_action: z.string().default("Review and assign to triage team"),
  confidence_score: z.number().min(0).max(1).default(0.94),
  tokens_consumed: z.number().int().nonnegative(),
});
export type LLMAnalysisOutput = z.infer<typeof LLMAnalysisOutputSchema>;

export interface TenantUsageSummary {
  id: string;
  name: string;
  plan_tier: string;
  monthly_token_budget: number;
  tokens_used: number;
  tokens_remaining: number;
  percentage_used: number;
  estimated_cost_usd: number;
  status: "normal" | "warning_80" | "exceeded_100";
}

export interface AnalyticsSummary {
  total_feedback: number;
  urgent_count: number;
  open_count: number;
  resolved_count: number;
  average_latency_ms: number;
  category_breakdown: {
    bug: number;
    feature_request: number;
    billing: number;
    other: number;
  };
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  cost_metrics: {
    tokens_consumed: number;
    estimated_usd: number;
    burn_rate_daily_avg: number;
  };
}
