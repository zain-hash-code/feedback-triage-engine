import { prisma } from "@/lib/prisma";
import { llmService } from "./llm-service";
import {
  CreateFeedbackInput,
  TenantUsageSummary,
  UpdateFeedbackInput,
  AnalyticsSummary,
} from "@/lib/types";

export class TenantNotFoundError extends Error {
  constructor(tenantId: string) {
    super(`Tenant '${tenantId}' not found`);
    this.name = "TenantNotFoundError";
  }
}

export class QuotaExceededError extends Error {
  constructor(public tenantId: string, public used: number, public budget: number) {
    super(`Tenant '${tenantId}' has exhausted its monthly token quota (${used}/${budget})`);
    this.name = "QuotaExceededError";
  }
}

export class FeedbackNotFoundError extends Error {
  constructor(feedbackId: string) {
    super(`Feedback entry '${feedbackId}' not found`);
    this.name = "FeedbackNotFoundError";
  }
}

export class FeedbackService {
  /**
   * Evaluate usage status based on quota utilization
   */
  static calculateUsageStatus(
    used: number,
    budget: number
  ): "normal" | "warning_80" | "exceeded_100" {
    if (budget <= 0) return "exceeded_100";
    const ratio = used / budget;
    if (ratio >= 1.0) return "exceeded_100";
    if (ratio >= 0.8) return "warning_80";
    return "normal";
  }

  /**
   * Get tenant usage summary with cost estimations and tier info
   */
  async getTenantUsage(tenantId: string): Promise<TenantUsageSummary> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new TenantNotFoundError(tenantId);
    }

    const percentage_used =
      tenant.monthly_token_budget > 0
        ? Math.round((tenant.tokens_used / tenant.monthly_token_budget) * 100)
        : 100;

    // Blended enterprise LLM rate: $3.00 per 1,000,000 tokens
    const estimated_cost_usd = Number(((tenant.tokens_used / 1_000_000) * 3.0).toFixed(4));

    return {
      id: tenant.id,
      name: tenant.name,
      plan_tier: tenant.plan_tier || "Enterprise Growth",
      monthly_token_budget: tenant.monthly_token_budget,
      tokens_used: tenant.tokens_used,
      tokens_remaining: Math.max(0, tenant.monthly_token_budget - tenant.tokens_used),
      percentage_used,
      estimated_cost_usd,
      status: FeedbackService.calculateUsageStatus(
        tenant.tokens_used,
        tenant.monthly_token_budget
      ),
    };
  }

  /**
   * Get aggregated executive analytics for the tenant
   */
  async getTenantAnalytics(tenantId: string): Promise<AnalyticsSummary> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new TenantNotFoundError(tenantId);
    }

    const entries = await prisma.feedbackEntry.findMany({
      where: { tenant_id: tenantId },
      include: { analysis: true },
    });

    let urgentCount = 0;
    let openCount = 0;
    let resolvedCount = 0;
    let totalLatency = 0;
    let analyzedCount = 0;

    const categoryBreakdown = {
      bug: 0,
      feature_request: 0,
      billing: 0,
      other: 0,
    };

    const sentimentBreakdown = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    for (const entry of entries) {
      if (entry.resolution_status === "open" || entry.resolution_status === "in_progress") {
        openCount++;
      }
      if (entry.resolution_status === "resolved") {
        resolvedCount++;
      }

      if (entry.analysis) {
        analyzedCount++;
        totalLatency += entry.analysis.latency_ms || 280;

        if (entry.analysis.urgency === "critical" || entry.analysis.urgency === "high") {
          if (entry.resolution_status !== "resolved") {
            urgentCount++;
          }
        }

        const cat = entry.analysis.category as keyof typeof categoryBreakdown;
        if (categoryBreakdown[cat] !== undefined) {
          categoryBreakdown[cat]++;
        }

        const sent = entry.analysis.sentiment as keyof typeof sentimentBreakdown;
        if (sentimentBreakdown[sent] !== undefined) {
          sentimentBreakdown[sent]++;
        }
      }
    }

    const estimatedUsd = Number(((tenant.tokens_used / 1_000_000) * 3.0).toFixed(4));
    const dailyAvgBurn = Math.round(tenant.tokens_used / 14);

    return {
      total_feedback: entries.length,
      urgent_count: urgentCount,
      open_count: openCount,
      resolved_count: resolvedCount,
      average_latency_ms: analyzedCount > 0 ? Math.round(totalLatency / analyzedCount) : 260,
      category_breakdown: categoryBreakdown,
      sentiment_breakdown: sentimentBreakdown,
      cost_metrics: {
        tokens_consumed: tenant.tokens_used,
        estimated_usd: estimatedUsd,
        burn_rate_daily_avg: dailyAvgBurn,
      },
    };
  }

  /**
   * Ingests feedback asynchronously
   */
  async ingestFeedback(tenantId: string, input: CreateFeedbackInput) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new TenantNotFoundError(tenantId);
    }

    if (tenant.tokens_used >= tenant.monthly_token_budget) {
      throw new QuotaExceededError(
        tenant.id,
        tenant.tokens_used,
        tenant.monthly_token_budget
      );
    }

    const entry = await prisma.feedbackEntry.create({
      data: {
        tenant_id: tenant.id,
        raw_text: input.raw_text,
        source: input.source || "web",
        assigned_to: input.assigned_to || null,
        status: "pending",
        resolution_status: "open",
      },
    });

    // Run asynchronously without blocking response
    this.processFeedbackAsync(entry.id, tenant.id, input.raw_text).catch((err) => {
      console.error(`Background processing failed for entry ${entry.id}:`, err);
    });

    return entry;
  }

  /**
   * Worker executing LLM triage and atomic token debit
   */
  async processFeedbackAsync(
    feedbackId: string,
    tenantId: string,
    rawText: string
  ) {
    const startTime = Date.now();
    try {
      const analysis = await llmService.analyzeFeedback(rawText);
      const latencyMs = Date.now() - startTime;

      await prisma.$transaction(async (tx) => {
        const existingEntry = await tx.feedbackEntry.findUnique({
          where: { id: feedbackId },
          include: { analysis: true },
        });

        if (!existingEntry || existingEntry.status === "processed" || existingEntry.analysis) {
          return;
        }

        const currentTenant = await tx.tenant.findUnique({
          where: { id: tenantId },
        });

        if (!currentTenant) {
          throw new TenantNotFoundError(tenantId);
        }

        const updatedTokens = currentTenant.tokens_used + analysis.tokens_consumed;

        await tx.tenant.update({
          where: { id: tenantId },
          data: {
            tokens_used: updatedTokens,
          },
        });

        // Determine default team assignment based on category
        let defaultAssignee = existingEntry.assigned_to;
        if (!defaultAssignee) {
          if (analysis.category === "bug") defaultAssignee = "Core Platform Engineering";
          else if (analysis.category === "billing") defaultAssignee = "Billing & Revenue Ops";
          else if (analysis.category === "feature_request") defaultAssignee = "Product Management";
          else defaultAssignee = "Customer Success";
        }

        await tx.feedbackAnalysis.create({
          data: {
            feedback_id: feedbackId,
            category: analysis.category,
            urgency: analysis.urgency,
            summary: analysis.summary,
            sentiment: analysis.sentiment,
            suggested_action: analysis.suggested_action,
            confidence_score: analysis.confidence_score,
            latency_ms: Math.max(latencyMs, 140),
            model_used: "claude-3-5-haiku",
            tokens_consumed: analysis.tokens_consumed,
          },
        });

        await tx.feedbackEntry.update({
          where: { id: feedbackId },
          data: {
            status: "processed",
            assigned_to: defaultAssignee,
          },
        });
      });
    } catch (error: any) {
      console.error(`Failed processing feedback ${feedbackId}:`, error?.message || error);

      await prisma.feedbackEntry.update({
        where: { id: feedbackId },
        data: {
          status: "failed",
        },
      }).catch((updateErr) => {
        console.error(`Could not mark entry ${feedbackId} as failed:`, updateErr);
      });
    }
  }

  /**
   * Update resolution status, assignment, and internal notes
   */
  async updateFeedback(
    feedbackId: string,
    tenantId: string,
    input: UpdateFeedbackInput
  ) {
    const entry = await prisma.feedbackEntry.findFirst({
      where: { id: feedbackId, tenant_id: tenantId },
    });

    if (!entry) {
      throw new FeedbackNotFoundError(feedbackId);
    }

    return prisma.feedbackEntry.update({
      where: { id: feedbackId },
      data: {
        ...(input.resolution_status && { resolution_status: input.resolution_status }),
        ...(input.assigned_to !== undefined && { assigned_to: input.assigned_to }),
        ...(input.internal_notes !== undefined && { internal_notes: input.internal_notes }),
      },
      include: {
        analysis: true,
      },
    });
  }

  /**
   * Batch update multiple feedback records
   */
  async batchUpdateFeedback(
    tenantId: string,
    feedbackIds: string[],
    action: {
      resolution_status?: string;
      assigned_to?: string;
    }
  ) {
    return prisma.feedbackEntry.updateMany({
      where: {
        id: { in: feedbackIds },
        tenant_id: tenantId,
      },
      data: {
        ...(action.resolution_status && { resolution_status: action.resolution_status }),
        ...(action.assigned_to && { assigned_to: action.assigned_to }),
      },
    });
  }

  /**
   * Multi-tenant isolated feedback listing
   */
  async listFeedback(
    tenantId: string,
    filters?: {
      category?: string;
      urgency?: string;
      search?: string;
      source?: string;
      resolution_status?: string;
    }
  ) {
    const whereClause: any = {
      tenant_id: tenantId,
    };

    if (filters?.source) {
      whereClause.source = filters.source;
    }

    if (filters?.resolution_status) {
      whereClause.resolution_status = filters.resolution_status;
    }

    if (filters?.category || filters?.urgency) {
      whereClause.analysis = {};
      if (filters.category) {
        whereClause.analysis.category = filters.category;
      }
      if (filters.urgency) {
        whereClause.analysis.urgency = filters.urgency;
      }
    }

    if (filters?.search) {
      whereClause.OR = [
        { raw_text: { contains: filters.search } },
        { assigned_to: { contains: filters.search } },
      ];
    }

    return prisma.feedbackEntry.findMany({
      where: whereClause,
      include: {
        analysis: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  /**
   * Reset tenant tokens (convenience method)
   */
  async resetTenantUsage(tenantId: string) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: { tokens_used: 0 },
    });
  }
}

export const feedbackService = new FeedbackService();
