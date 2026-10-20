# Pulse Triage — Autonomous Customer Feedback Intelligence & Token Governance

**Pulse Triage** is an enterprise-grade, multi-tenant customer voice triage and AI token metering platform. It transforms noisy, unstructured customer feedback from Zendesk, Intercom, Stripe, In-App voice, and email into structured, prioritized engineering intelligence while enforcing strict token quotas and cost controls in real time.

---

## What's Inside

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Pulse Triage Architecture                          │
├─────────────────┬───────────────────────────┬───────────────────────────────┤
│ Ingestion Layer │ AI Classification Engine  │ Action & Governance           │
├─────────────────┼───────────────────────────┼───────────────────────────────┤
│ • Zendesk       │ • Claude 3.5 Haiku        │ • SLA Prioritization Queue    │
│ • Intercom      │ • Zod Strict Schema Check │ • Real-Time Token Burn Ledger │
│ • Stripe Events │ • Latency & Cost Tracker  │ • Team Assignment Engine      │
│ • In-App Voice  │ • Auto-Retry Exponential  │ • Linear / Slack Integrations │
│ • API Webhooks  │ • Prompt Injection Guard  │ • Batch CSV Export            │
└─────────────────┴───────────────────────────┴───────────────────────────────┘
```

---

## Enterprise Feature Set

### 1. Executive Analytics & Telemetry
* **Live KPI Deck:** Real-time feedback volume with trend projections, urgent SLA incident tracker, active token burn-rate with dollar cost calculation ($0.085 / $0.300 allocated), and Customer Sentiment Health Index (% positive vs neutral vs negative).
* **Category Share Bar:** Interactive category distribution (Bugs, Feature Requests, Billing, General) with 1-click filtering and average inference latency benchmarks (`~240ms`).

### 2. High-Performance Triage Stream
* **Smart Views:** Instant toggling between *All Feedback* and *Urgent SLA Incidents*.
* **Multi-Channel Tagging:** Native badge recognition for Zendesk, Intercom, Stripe, Web, Email, and REST API.
* **Bulk Action Bar:** Floating bottom toolbar allowing multi-row selection for bulk status updates (*Mark Resolved*, *Mark In Progress*) or targeted CSV exports.

### 3. Slide-Over Triage Inspector (Drawer)
Clicking any ticket opens an enterprise inspector:
* **Autonomous AI Assessment:** Executive summary, domain category, urgency rating, sentiment index, and model confidence score (`98% confidence`).
* **Suggested Operational Action:** Clear operational guidance (e.g. *"P0 Alert: Assign to On-Call Platform Engineering; review Stripe 3DS auth logs"*).
* **Cost & Telemetry Footprint:** Exact token consumption, millisecond latency, and estimated query cost in USD.
* **Workflow & Team Assignment:** Update resolution status (`Open`, `In Progress`, `Resolved`, `Dismissed`), assign team (`Platform Engineering`, `Billing Ops`, `Product Management`), and add internal engineering notes.
* **1-Click Integration Simulator:** Simulate dispatching tickets to Linear (`#ENG-489`) or alerting `#incidents` in Slack.

### 4. Developer Ingestion Console & Webhook Simulator
* **Manual Voice Ingestion:** Ingest customer voice with channel selection and auto-assignment.
* **Live Webhook Simulator:** Interactive JSON payload editor with pre-configured templates for Stripe charges, Zendesk tickets, and Intercom conversations.

---

## Quick Start Guide

### 1. Installation & Setup
```bash
pnpm install
pnpm db:push
pnpm db:seed
```
Seeds 3 sample organizations with realistic enterprise tickets:
* **Acme Corporation (`tenant-acme`):** Enterprise Scale tier (healthy 28% utilization)
* **Globex Dynamics (`tenant-globex`):** Growth tier (85% warning threshold)
* **Initech Labs (`tenant-initech`):** Starter tier (100% quota exhausted)

### 2. Launch Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Run Automated Test Suite
```bash
pnpm test
```
Runs all 23 unit, integration, and UI component tests.

### 4. Build for Production
```bash
pnpm build
```

---

## Security & Architecture Standards

* **ACID Transaction Isolation:** Token deductions and analysis creations are executed within atomic `prisma.$transaction` blocks to eliminate race conditions and double-billing.
* **Prompt Injection Defense:** Input is normalized and stripped of control characters; boundary tags (`</user_feedback>`, `<system>`) are sanitized before inference.
* **Multi-Tenant Privacy:** All database operations strictly mandate tenant scoping (`tenant_id`); cross-tenant query bleeding is prevented at the ORM layer.
