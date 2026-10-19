import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { feedbackService, QuotaExceededError } from "@/services/feedback-service";

describe("Concurrency & Atomic Token Ledger Integration", () => {
  const testTenantId = "test-tenant-concurrency";

  beforeEach(async () => {
    // Reset test tenant state before each test
    await prisma.feedbackAnalysis.deleteMany({
      where: { feedback_entry: { tenant_id: testTenantId } },
    });
    await prisma.feedbackEntry.deleteMany({
      where: { tenant_id: testTenantId },
    });
    await prisma.tenant.deleteMany({
      where: { id: testTenantId },
    });

    await prisma.tenant.create({
      data: {
        id: testTenantId,
        name: "Concurrency Test Corp",
        monthly_token_budget: 10000,
        tokens_used: 0,
      },
    });
  });

  afterAll(async () => {
    await prisma.feedbackAnalysis.deleteMany({
      where: { feedback_entry: { tenant_id: testTenantId } },
    });
    await prisma.feedbackEntry.deleteMany({
      where: { tenant_id: testTenantId },
    });
    await prisma.tenant.deleteMany({
      where: { id: testTenantId },
    });
    await prisma.$disconnect();
  });

  it("handles simultaneous feedback processing without race conditions or token corruption", async () => {
    const feedbackItems = [
      "Bug 1: Modal does not close when clicking overlay.",
      "Bug 2: Login button unresponsive on Safari mobile.",
      "Bug 3: Table sorting inverted on column click.",
      "Bug 4: Notification badge count remains stuck at 1.",
      "Bug 5: Password reset email link expires prematurely.",
    ];

    // Ingest all items concurrently
    const entries = await Promise.all(
      feedbackItems.map((text) =>
        feedbackService.ingestFeedback(testTenantId, { raw_text: text, source: "web" })
      )
    );

    expect(entries.length).toBe(5);

    // Wait for all 5 background tasks to complete processing
    let processedEntries: any[] = [];
    for (let i = 0; i < 40; i++) {
      processedEntries = await prisma.feedbackEntry.findMany({
        where: { tenant_id: testTenantId, status: "processed" },
        include: { analysis: true },
      });
      if (processedEntries.length === 5) break;
      await new Promise((res) => setTimeout(res, 50));
    }

    expect(processedEntries.length).toBe(5);
    expect(processedEntries.every((e) => e.status === "processed")).toBe(true);

    // Sum of tokens consumed by individual analyses
    const totalTokensConsumed = processedEntries.reduce(
      (sum, e) => sum + (e.analysis?.tokens_consumed || 0),
      0
    );

    // Fetch tenant from database
    const updatedTenant = await prisma.tenant.findUnique({
      where: { id: testTenantId },
    });

    // Verify that tenant tokens_used matches the exact sum of processed tokens
    expect(updatedTenant?.tokens_used).toBe(totalTokensConsumed);
    expect(updatedTenant?.tokens_used).toBeGreaterThan(0);
  });

  it("ensures idempotency prevents duplicate debiting if worker executes more than once", async () => {
    const entry = await feedbackService.ingestFeedback(testTenantId, {
      raw_text: "Invoice export timeout on large accounts.",
      source: "email",
    });

    // Wait for background worker
    for (let i = 0; i < 20; i++) {
      const e = await prisma.feedbackEntry.findUnique({ where: { id: entry.id } });
      if (e?.status === "processed") break;
      await new Promise((r) => setTimeout(r, 50));
    }

    const tenantAfterFirst = await prisma.tenant.findUnique({ where: { id: testTenantId } });
    const tokensAfterFirst = tenantAfterFirst?.tokens_used || 0;
    expect(tokensAfterFirst).toBeGreaterThan(0);

    // Intentionally trigger a duplicate execution
    await feedbackService.processFeedbackAsync(entry.id, testTenantId, entry.raw_text);

    const tenantAfterDuplicate = await prisma.tenant.findUnique({ where: { id: testTenantId } });
    // Balance should remain unchanged!
    expect(tenantAfterDuplicate?.tokens_used).toBe(tokensAfterFirst);
  });

  it("rejects feedback when tenant has reached or exceeded token quota", async () => {
    // Set tenant tokens_used equal to budget
    await prisma.tenant.update({
      where: { id: testTenantId },
      data: {
        tokens_used: 10000,
        monthly_token_budget: 10000,
      },
    });

    await expect(
      feedbackService.ingestFeedback(testTenantId, {
        raw_text: "This should be rejected due to quota limit.",
        source: "api",
      })
    ).rejects.toThrow(QuotaExceededError);

    // Verify no new pending feedback entry was persisted
    const entries = await prisma.feedbackEntry.findMany({
      where: { tenant_id: testTenantId },
    });
    expect(entries.length).toBe(0);
  });
});
