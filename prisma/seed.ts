import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Enterprise SaaS database...");

  // Clean existing records
  await prisma.feedbackAnalysis.deleteMany();
  await prisma.feedbackEntry.deleteMany();
  await prisma.tenant.deleteMany();

  // 1. Acme Corporation (Enterprise Growth - Active healthy utilization)
  const tenant1 = await prisma.tenant.create({
    data: {
      id: "tenant-acme",
      name: "Acme Corporation",
      plan_tier: "Enterprise Scale",
      monthly_token_budget: 100000,
      tokens_used: 28450, // ~28%
      rate_limit_per_min: 300,
    },
  });

  // 2. Globex Dynamics (Pro Tier - Approaching Warning Threshold)
  const tenant2 = await prisma.tenant.create({
    data: {
      id: "tenant-globex",
      name: "Globex Dynamics",
      plan_tier: "Growth Tier",
      monthly_token_budget: 30000,
      tokens_used: 25600, // ~85%
      rate_limit_per_min: 150,
    },
  });

  // 3. Initech Labs (Starter - Exhausted Budget)
  const tenant3 = await prisma.tenant.create({
    data: {
      id: "tenant-initech",
      name: "Initech Labs",
      plan_tier: "Starter Tier",
      monthly_token_budget: 10000,
      tokens_used: 10000, // 100%
      rate_limit_per_min: 60,
    },
  });

  // Sample feedback entries for Acme Corp
  const entries = [
    {
      tenant_id: tenant1.id,
      raw_text: "URGENT: Stripe checkout is throwing 500 internal server errors for EU customers trying to pay with 3D Secure verification cards on mobile web.",
      source: "stripe",
      status: "processed",
      resolution_status: "in_progress",
      assigned_to: "Core Platform Engineering",
      internal_notes: "Sentry incident #3829 linked. Issue identified in webhook idempotency middleware.",
      analysis: {
        category: "bug",
        urgency: "critical",
        summary: "Stripe checkout 500 error on EU 3DS card verification.",
        sentiment: "negative",
        suggested_action: "P0 Alert: Assign to On-Call Platform Engineering; review Stripe 3DS auth logs",
        confidence_score: 0.98,
        latency_ms: 245,
        model_used: "claude-3-5-haiku",
        tokens_consumed: 185,
      },
    },
    {
      tenant_id: tenant1.id,
      raw_text: "Customer ticket via Zendesk: Our finance team was double-charged for our Enterprise seat expansion on June 15th ($4,200 duplicate charge). Please issue a credit ASAP.",
      source: "zendesk",
      status: "processed",
      resolution_status: "open",
      assigned_to: "Billing & Revenue Ops",
      internal_notes: "Invoice #INV-2026-881 verified. Pending refund approval from CFO.",
      analysis: {
        category: "billing",
        urgency: "critical",
        summary: "Enterprise customer double-charged $4,200 for seat expansion.",
        sentiment: "negative",
        suggested_action: "Immediate escalation to Billing Operations; initiate Stripe refund audit",
        confidence_score: 0.97,
        latency_ms: 198,
        model_used: "claude-3-5-haiku",
        tokens_consumed: 165,
      },
    },
    {
      tenant_id: tenant1.id,
      raw_text: "From Intercom conversation: Would really appreciate the ability to schedule automated bi-weekly PDF report exports to our compliance Slack channel.",
      source: "intercom",
      status: "processed",
      resolution_status: "open",
      assigned_to: "Product Management",
      internal_notes: "Added to Q3 Slack bot integration epic.",
      analysis: {
        category: "feature_request",
        urgency: "medium",
        summary: "Requesting automated bi-weekly PDF compliance reports to Slack.",
        sentiment: "positive",
        suggested_action: "Tag Product Management; append to Q3 Integration Roadmap backlog",
        confidence_score: 0.91,
        latency_ms: 310,
        model_used: "claude-3-5-haiku",
        tokens_consumed: 120,
      },
    },
    {
      tenant_id: tenant1.id,
      raw_text: "In-App Feedback: The new dark mode and sub-second query latency on the analytics board is phenomenal. Great job engineering team!",
      source: "web",
      status: "processed",
      resolution_status: "resolved",
      assigned_to: "Customer Success",
      internal_notes: "Customer contacted for case study quote.",
      analysis: {
        category: "other",
        urgency: "low",
        summary: "Praise for dark mode design and lightning-fast query latency.",
        sentiment: "positive",
        suggested_action: "Share praise in company #customer-love Slack channel",
        confidence_score: 0.96,
        latency_ms: 154,
        model_used: "claude-3-5-haiku",
        tokens_consumed: 88,
      },
    },
    {
      tenant_id: tenant1.id,
      raw_text: "API webhook error report: Batch sync endpoint /api/v2/contacts timed out after 30,000ms when importing more than 10,000 records in a single payload.",
      source: "api",
      status: "processed",
      resolution_status: "in_progress",
      assigned_to: "Core Platform Engineering",
      internal_notes: "Investigating database indexing on foreign key contact_tenant_idx.",
      analysis: {
        category: "bug",
        urgency: "high",
        summary: "Batch contact import endpoint times out on payloads > 10k records.",
        sentiment: "negative",
        suggested_action: "Log GitHub issue and route to Core Web Team for reproduction",
        confidence_score: 0.94,
        latency_ms: 220,
        model_used: "claude-3-5-haiku",
        tokens_consumed: 142,
      },
    },
  ];

  for (const item of entries) {
    const { analysis, ...entryData } = item;
    await prisma.feedbackEntry.create({
      data: {
        ...entryData,
        analysis: {
          create: analysis,
        },
      },
    });
  }

  // Globex feedback
  await prisma.feedbackEntry.create({
    data: {
      tenant_id: tenant2.id,
      raw_text: "Zendesk ticket: Mobile navigation hamburger menu closes prematurely on iOS Safari 17.5.",
      source: "zendesk",
      status: "processed",
      resolution_status: "open",
      assigned_to: "Frontend Core",
      analysis: {
        create: {
          category: "bug",
          urgency: "medium",
          summary: "Mobile drawer closes unexpectedly on iOS Safari.",
          sentiment: "neutral",
          suggested_action: "Log GitHub issue and route to Core Web Team for reproduction",
          confidence_score: 0.88,
          latency_ms: 195,
          model_used: "claude-3-5-haiku",
          tokens_consumed: 112,
        },
      },
    },
  });

  console.log("Enterprise database seeded with rich real-world SaaS data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
