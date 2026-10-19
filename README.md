# AI-Powered Customer Feedback Triage & Usage Metering ([FEAT-204])

An enterprise SaaS full-stack feature that ingests unstructured customer feedback, classifies it via an LLM pipeline, stores it in a relational database, and tracks tenant token usage against quotas with real-time UI warnings.

---

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Setup Database & Seed Initial Data
The project uses SQLite via Prisma for instant zero-dependency execution:
```bash
pnpm db:push
pnpm db:seed
```
This automatically seeds 3 tenants with different quota scenarios:
* **Acme Corporation (`tenant-acme`):** Healthy usage (25% utilized)
* **Globex Dynamics (`tenant-globex`):** Warning threshold (86% utilized - amber alert)
* **Initech Labs (`tenant-initech`):** Exceeded quota (100% utilized - red rejection state)

### 3. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive dashboard.

### 4. Run Test Suite
```bash
pnpm test
```
Executes all 23 unit, integration, and UI component tests across 5 test suites.

---

## Architectural Highlights

* **Multi-Tenant Isolation:** All database reads and writes are explicitly scoped by `tenant_id`.
* **Idempotent Background Worker:** Ingestion API returns `202 Accepted` immediately, delegating classification to an asynchronous worker guarded against duplicate execution and double-billing.
* **Atomic Token Metering:** Deductions occur within a database transaction with balance assertions.
* **LLM Resilience:** Validated with Zod schemas; exponential backoff retries on rate limits (429) or server errors (5xx); fallback safe-mode leaves tokens uncharged if inference fails.
* **Security:** Input sanitized for stored XSS and prompt injection boundaries neutralized.

---

## Project Structure

```text
A:\Upwork Evaluation\
├── prisma/
│   ├── schema.prisma         # Relational schema (tenants, feedback, analysis)
│   └── seed.ts               # Database seed script
├── src/
│   ├── app/
│   │   ├── api/v1/feedback/  # Ingestion & listing endpoints
│   │   ├── api/v1/tenants/   # Tenant usage & reset endpoints
│   │   ├── layout.tsx        # App layout
│   │   └── page.tsx          # Real-time dashboard
│   ├── components/
│   │   ├── TenantMeter.tsx   # Real-time usage progress bar (80%/100% warnings)
│   │   ├── FeedbackTable.tsx # Responsive table/card view + AI summaries
│   │   ├── FeedbackSubmitModal.tsx # Ingestion modal with templates
│   │   ├── FilterBar.tsx     # Filters and tenant switcher
│   │   └── Badges.tsx        # Visual badges (urgency, sentiment, category)
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── security.ts       # XSS and prompt injection defenses
│   │   └── types.ts          # Zod validation schemas and TypeScript types
│   ├── services/
│   │   ├── feedback-service.ts # Core business logic & transactions
│   │   └── llm-service.ts    # LLM classification with retry & Zod parsing
│   └── __tests__/            # 23 tests (security, isolation, concurrency, meter, LLM)
├── PR_SUMMARY.md             # Detailed engineering review & audit artifact
└── package.json
```
