import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { feedbackService } from "@/services/feedback-service";

describe("Multi-Tenant Data Isolation", () => {
  const tenantA = "tenant-isolation-a";
  const tenantB = "tenant-isolation-b";

  beforeEach(async () => {
    // Clean up
    await prisma.feedbackAnalysis.deleteMany({
      where: {
        feedback_entry: {
          tenant_id: { in: [tenantA, tenantB] },
        },
      },
    });
    await prisma.feedbackEntry.deleteMany({
      where: { tenant_id: { in: [tenantA, tenantB] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantA, tenantB] } },
    });

    // Create tenants
    await prisma.tenant.create({
      data: { id: tenantA, name: "Tenant Alpha", monthly_token_budget: 20000 },
    });
    await prisma.tenant.create({
      data: { id: tenantB, name: "Tenant Beta", monthly_token_budget: 20000 },
    });

    // Ingest feedback for Tenant A
    await prisma.feedbackEntry.create({
      data: {
        tenant_id: tenantA,
        raw_text: "Confidential Tenant A ticket information.",
        source: "web",
        status: "processed",
      },
    });

    // Ingest feedback for Tenant B
    await prisma.feedbackEntry.create({
      data: {
        tenant_id: tenantB,
        raw_text: "Confidential Tenant B ticket information.",
        source: "email",
        status: "processed",
      },
    });
  });

  afterAll(async () => {
    await prisma.feedbackAnalysis.deleteMany({
      where: {
        feedback_entry: {
          tenant_id: { in: [tenantA, tenantB] },
        },
      },
    });
    await prisma.feedbackEntry.deleteMany({
      where: { tenant_id: { in: [tenantA, tenantB] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantA, tenantB] } },
    });
    await prisma.$disconnect();
  });

  it("strictly prevents Tenant B from accessing Tenant A's feedback records", async () => {
    const tenantBResults = await feedbackService.listFeedback(tenantB);

    expect(tenantBResults.length).toBe(1);
    expect(tenantBResults[0].raw_text).toBe("Confidential Tenant B ticket information.");
    expect(tenantBResults.some((item) => item.tenant_id === tenantA)).toBe(false);
  });

  it("strictly prevents Tenant A from accessing Tenant B's feedback records", async () => {
    const tenantAResults = await feedbackService.listFeedback(tenantA);

    expect(tenantAResults.length).toBe(1);
    expect(tenantAResults[0].raw_text).toBe("Confidential Tenant A ticket information.");
    expect(tenantAResults.some((item) => item.tenant_id === tenantB)).toBe(false);
  });
});
