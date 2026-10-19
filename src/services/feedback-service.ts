import { prisma } from "@/lib/prisma";
import { llmService } from "./llm-service";
import { CreateFeedbackInput, TenantUsageSummary } from "@/lib/types";

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

export class FeedbackService {
  /**
   * Helper to evaluate warning thresholds:
   * >= 100%: exceeded_100
   * >= 80%: warning_80
   * < 80%: normal
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
   * Get tenant usage summary with status badges
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

    return {
      id: tenant.id,
      name: tenant.name,
      monthly_token_budget: tenant.monthly_token_budget,
      tokens_used: tenant.tokens_used,
      tokens_remaining: Math.max(0, tenant.monthly_token_budget - tenant.tokens_used),
      percentage_used,
      status: FeedbackService.calculateUsageStatus(
        tenant.tokens_used,
        tenant.monthly_token_budget
      ),
    };
  }

  /**
   * Ingests feedback asynchronously:
   * 1. Checks tenant existence and quota.
   * 2. Saves pending feedback record.
   * 3. Dispatches background LLM worker (non-blocking).
   */
  async ingestFeedback(tenantId: string, input: CreateFeedbackInput) {
    // 1. Validate tenant & quota
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

    // 2. Persist initial pending feedback entry
    const entry = await prisma.feedbackEntry.create({
      data: {
        tenant_id: tenant.id,
        raw_text: input.raw_text,
        source: input.source || "web",
        status: "pending",
      },
    });

    // 3. Dispatch background worker (non-blocking async)
    // Run asynchronously without awaiting so caller receives immediate 202/201 response
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
    try {
      // Step A: Call LLM
      const analysis = await llmService.analyzeFeedback(rawText);

      // Step B: Atomically record analysis & debit tenant tokens in a transaction
      await prisma.$transaction(async (tx) => {
        // Query entry to ensure idempotency and prevent duplicate debiting
        const existingEntry = await tx.feedbackEntry.findUnique({
          where: { id: feedbackId },
          include: { analysis: true },
        });

        if (!existingEntry || existingEntry.status === "processed" || existingEntry.analysis) {
          // Already processed; exit gracefully
          return;
        }

        // Query tenant within transaction for concurrency safety
        const currentTenant = await tx.tenant.findUnique({
          where: { id: tenantId },
        });

        if (!currentTenant) {
          throw new TenantNotFoundError(tenantId);
        }

        const updatedTokens = currentTenant.tokens_used + analysis.tokens_consumed;

        // Update tenant balance atomically
        await tx.tenant.update({
          where: { id: tenantId },
          data: {
            tokens_used: updatedTokens,
          },
        });

        // Create feedback analysis
        await tx.feedbackAnalysis.create({
          data: {
            feedback_id: feedbackId,
            category: analysis.category,
            urgency: analysis.urgency,
            summary: analysis.summary,
            sentiment: analysis.sentiment,
            tokens_consumed: analysis.tokens_consumed,
          },
        });

        // Mark entry processed
        await tx.feedbackEntry.update({
          where: { id: feedbackId },
          data: {
            status: "processed",
          },
        });
      });
    } catch (error: any) {
      console.error(`Failed processing feedback ${feedbackId}:`, error?.message || error);

      // In case of error (timeout, malformed output, etc.), mark entry as failed
      // and DO NOT debit tenant tokens.
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
   * Multi-tenant isolated feedback listing
   */
  async listFeedback(
    tenantId: string,
    filters?: {
      category?: string;
      urgency?: string;
      search?: string;
    }
  ) {
    const whereClause: any = {
      tenant_id: tenantId, // Strict tenant scoping
    };

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
      whereClause.raw_text = {
        contains: filters.search,
      };
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
   * Reset tenant tokens (convenience method for testing and demo evaluation)
   */
  async resetTenantUsage(tenantId: string) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: { tokens_used: 0 },
    });
  }
}

export const feedbackService = new FeedbackService();
