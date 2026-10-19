import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing records
  await prisma.feedbackAnalysis.deleteMany();
  await prisma.feedbackEntry.deleteMany();
  await prisma.tenant.deleteMany();

  // Create Tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      id: "tenant-acme",
      name: "Acme Corporation",
      monthly_token_budget: 50000,
      tokens_used: 12450, // ~25%
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      id: "tenant-globex",
      name: "Globex Dynamics",
      monthly_token_budget: 20000,
      tokens_used: 17200, // 86% - Warning state
    },
  });

  const tenant3 = await prisma.tenant.create({
    data: {
      id: "tenant-initech",
      name: "Initech Labs",
      monthly_token_budget: 10000,
      tokens_used: 10000, // 100% - Exceeded state
    },
  });

  // Seed Feedback for Acme
  const fb1 = await prisma.feedbackEntry.create({
    data: {
      tenant_id: tenant1.id,
      raw_text: "The export to CSV button is completely broken when filtering by date range on Firefox.",
      source: "web",
      status: "processed",
      analysis: {
        create: {
          category: "bug",
          urgency: "high",
          summary: "CSV export fails on Firefox when date range filter is active.",
          sentiment: "negative",
          tokens_consumed: 145,
        },
      },
    },
  });

  const fb2 = await prisma.feedbackEntry.create({
    data: {
      tenant_id: tenant1.id,
      raw_text: "Would love to see a native Slack notification integration for high-priority incidents.",
      source: "email",
      status: "processed",
      analysis: {
        create: {
          category: "feature_request",
          urgency: "medium",
          summary: "Requesting Slack integration for incident alerts.",
          sentiment: "positive",
          tokens_consumed: 110,
        },
      },
    },
  });

  const fb3 = await prisma.feedbackEntry.create({
    data: {
      tenant_id: tenant1.id,
      raw_text: "We were double-billed on our latest monthly invoice. Please refund the duplicate charge ASAP.",
      source: "api",
      status: "processed",
      analysis: {
        create: {
          category: "billing",
          urgency: "critical",
          summary: "Double-billing detected on monthly invoice; refund requested urgently.",
          sentiment: "negative",
          tokens_consumed: 160,
        },
      },
    },
  });

  // Seed Feedback for Globex
  await prisma.feedbackEntry.create({
    data: {
      tenant_id: tenant2.id,
      raw_text: "Great performance improvements on the analytics chart! Loading is twice as fast.",
      source: "web",
      status: "processed",
      analysis: {
        create: {
          category: "other",
          urgency: "low",
          summary: "User praising recent analytics loading speed improvements.",
          sentiment: "positive",
          tokens_consumed: 95,
        },
      },
    },
  });

  console.log("Database seeded successfully with 3 tenants and sample feedback.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
