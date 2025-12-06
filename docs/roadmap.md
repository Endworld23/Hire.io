# Hire.io — Master Product, Feature & Architecture Reference

> **Version:** 1.1  
> **Owner:** Aaron Martin  
> **Last Updated:** December 2025  
>  
> This document is the single source of truth for all Hire.io planning, design, development, and feature work.  
> Every file, phase, and product decision within this folder should align to the structure and priorities outlined here.
>
> **Authoritative DB Source:** `supabase/migrations/<timestamp>_consolidated_schema.sql`  
> **Companion Docs:** [`docs/architecture.md`](./architecture.md), [`docs/security-and-eeo.md`](./security-and-eeo.md)

---

## Vision

Hire.io is a next-generation **Staffing Agency Enablement Platform** — a transparent, AI-driven, and compliance-ready system for modern staffing firms.

> “Shopify for staffing agencies — built for fairness, transparency, and speed.”

Two key pillars:

1. **Global Candidate Pool (Hire.io side)**  
   - A single, global candidate profile system where candidates can create and maintain their profiles (with or without a tenant).  
   - Candidates can opt into AI-driven discovery, pool gauges, and future job recommendations.

2. **Multi-Tenant ATS for Agencies (Tenant side)**  
   - Each staffing agency/employer runs their own ATS instance (a “storefront” like Shopify).  
   - Jobs, pipelines, clients, and analytics are tenant-specific and isolated via RLS.

Hire.io helps agencies:

- Operate a modern, bias-minimized ATS  
- Offer clients transparent, EEO-blind candidate review portals  
- Empower recruiters with AI-assisted workflows and pool gauges  
- Maintain data ownership and EEO compliance  
- Build efficiency and consistency across placements  

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| **EEO-Blind Compliance** | Anonymized candidate profiles ensure bias-reduced client views; only job-linked candidates are visible to tenants/clients. |
| **AI Assistance** | Job intake Q&A, fit summaries, pool gauges, predictive search, and smart matching on top of global + tenant data. |
| **Transparency** | Clients and candidates can both see relevant activity and engagement (within safe, consented boundaries). |
| **Data Security** | No raw data exports, watermarked resume viewing, strict audit logs, and RLS-enforced multi-tenancy. |
| **Affordability** | SaaS pricing that scales from solo recruiters and small agencies to large firms. |
| **Scalability** | Modular build-out that scales through defined roadmap phases, without breaking early contracts. |

---

## System Overview

### Core Product Modules

1. **Global Candidate Layer**
   - Candidate sign-up (with or without tenant)  
   - Resume upload, parsing, and structured profiles  
   - Visibility & consent management (AI/marketplace opt-ins)

2. **ATS Core (Per Tenant)**
   - Job requisitions, pipelines, and application tracking  
   - Recruiter & admin views, activity logs, and notes  
   - Per-tenant stages and workflows

3. **Client Portal**
   - EEO-blind candidate review per job  
   - Approve / reject / request interview flows  
   - Light-weight analytics per job

4. **Search & Matching Engine**
   - Skill/keyword search and filters  
   - **Leniency Slider** to adjust strictness  
   - **Candidate Pool Gauge** (volume/potential, not direct identities)  
   - AI-assisted shortlists and fit narratives

5. **AI Layer**
   - Job spec calibration (intake wizard)  
   - Fit summaries (job + candidate)  
   - Pool gauge and pipeline analytics  
   - Future: predictive models and auto-sourcing agents

6. **Analytics & Reports**
   - Time-to-fill, funnel conversion, recruiter productivity  
   - Client-facing reports for transparency

7. **Integrations & Communication**
   - Email (Resend/SendGrid)  
   - Future: calendar sync, SMS, job boards, background checks

---

## Product Roadmap Phases

| Phase | Name | Goal | Duration | Status |
|-------|------|------|----------|--------|
| 0 | **Foundations** | Infra, consolidated schema, core docs | 2–3 weeks | In Progress / Partial |
| 1 | **MVP (Pilot)** | Global candidates + core ATS + client portal for 3–5 agencies | 10–12 weeks | Planned |
| 2 | **Beta** | Operational SaaS (10–20 agencies) | +3–4 months | Pending |
| 3 | **Growth** | Monetization, billing, automation | +6 months | Future |
| 4 | **Enterprise** | SSO, API, white-label version | +12–18 months | Future |
| 5 | **AI Intelligence** | Predictive matching & analytics | +24 months | Future |
| 6 | **Ecosystem** | Marketplace, verified credentials, community | Year 3+ | Future |

---

## Phase 0 — Foundations

**Goal:** Establish full project infrastructure, **global+tenant-aware schema**, and baseline documentation.

### Deliverables

#### 1. Tech Setup

- Next.js (App Router) + Tailwind  
- Supabase (Postgres + Auth + Storage)  
- Environment management (Vercel + Supabase project configured)  
- ESLint + TypeScript strict mode  

#### 2. Repo & Docs

- Monorepo structure (or single app with clear folders):  
  - `/app` (Next.js)  
  - `/components`  
  - `/supabase/migrations`  
  - `/docs` (this roadmap, architecture, security/EEO)  
- Core documentation:
  - `docs/architecture.md` — system design & data model  
  - `docs/security-and-eeo.md` — compliance & bias prevention  
  - `docs/roadmap.md` — **this** master document  
  - `README.md` — repo-level summary & quickstart

#### 3. Database Schema (Authoritative)

Implemented via `supabase/migrations/<timestamp>_consolidated_schema.sql`.

Key tables / concepts:

- **tenants** — per-agency organizations  
- **users** — app users (global or tenant-scoped) with roles:  
  - `super_admin`, `admin`, `recruiter`, `client`, `candidate`  
- **jobs** — per-tenant job requisitions, with `status` in:  
  - `draft`, `active`, `closed`, `archived`  
- **candidates** — global/tenant-aware candidate profiles, including:  
  - Link to `users` (optional)  
  - Public `public_id` for EEO-blind views  
  - Space to support global vs tenant-imported candidates and visibility flags  
- **applications** — job↔candidate link within a tenant, with:  
  - Extended pipeline stages:  
    - `new` → `applied` → `recruiter_screen` → `screening` →  
      `submitted_to_client` → `client_shortlisted` / `client_rejected` →  
      `interview` → `offer` → `hired` / `rejected`  
  - `score` (general) and `match_score` (AI matching)  
- **stages** — per-tenant pipeline definitions  
- **events** — audit log (append-only)  
- **skills** — normalized skill taxonomy  
- **job_application_feedback** — structured feedback per application  

All tables have Row Level Security (RLS); tenant isolation is enforced via JWT `tenant_id`, and **roles** gate writes and global visibility.

---

## Phase 1 — MVP (Pilot-Ready)

**Goal:** Deliver a **functional platform** to 3–5 staffing agencies, including:

- Global candidate onboarding (self-service)  
- Per-tenant ATS with pipelines and applications  
- EEO-blind client portal per job  
- First version of AI-assisted matching and pool gauge  

### Modules

#### 1. Authentication & Onboarding

- Supabase Auth with role-aware JWT (`user_id`, `tenant_id`, `role`)  
- **Global Candidate Onboarding**:
  - Candidate sign up / sign in (email + social logins, e.g. LinkedIn)  
  - Create/update global candidate profile tied to `users.id`  
- **Tenant Onboarding**:
  - Create agency (tenant) as `super_admin/admin` flow  
  - Invite recruiter and client users (email-based invites)  
  - Role separation:
    - `super_admin` — internal Hire.io operations, full global visibility (within RLS constraints)  
    - `admin` — per-tenant owner/admin  
    - `recruiter` — per-tenant recruiter  
    - `client` — client-facing user attached to a tenant  
    - `candidate` — job seekers (global profile, may or may not be attached to a tenant yet)

#### 2. Core ATS (Per Tenant)

- Job requisition builder (with AI intake Q&A)  
- Job listing, editing, status transitions (`draft` → `active` → `closed`/`archived`)  
- Candidate application creation:
  - From global candidate self-apply  
  - From recruiter-imported candidates  
- Pipeline management:
  - Basic stage transitions through extended application stages  
  - Internal activity & audit log using `events`

#### 3. Client Portal (EEO-Blind)

- Client dashboard per job (scoped by tenant & role)  
- Candidate cards (EEO-blind):
  - Pseudonymous `public_id`  
  - Skills/experience summary  
  - High-level location only  
- Feedback actions:
  - Approve / reject / request interview  
  - Updates `applications.stage` and writes `job_application_feedback`  
- Controlled, watermark viewer for any resume-like views (no raw exports)

#### 4. Search & Matching (v1)

- Internal search:
  - List/filter jobs per recruiter  
  - Basic candidate search (within tenant context)
- Matching:
  - Simple rules-based or heuristic match for `match_score`  
  - **Leniency Slider**:
    - Adjusts thresholds on skill matching / required vs nice-to-have  
  - **Pool Gauge (v1)**:
    - Aggregate counts of potentially matching candidates across global + tenant data  
    - Returns numbers and distribution, not direct candidate identities in client mode  
- AI fit summaries for internal recruiter view:
  - Given a job + candidate, output a structured pros/cons fit narrative

#### 5. Notifications (v1)

- Automated emails:
  - New candidate applied  
  - Client feedback submitted  
  - Interview requested / status changed  
- Provider:
  - Resend or SendGrid integration  
- Templates:
  - Stored and versioned in code with simple placeholders

#### 6. Analytics (v1)

- Internal recruiter dashboards:
  - Active jobs per recruiter  
  - Candidate funnel counts per job (per stage)  
  - Basic time-to-fill metric (based on `events` and `applications` timestamps)  

---

## Phase 2 — Beta (Production-Ready)

**Goal:** Transition into **real agency use** with daily reliance; support 10–20 agencies.

### Key Enhancements

- Bulk candidate upload (CSV/Excel) with mapping to global profiles  
- Tagging and filtering for candidates and jobs  
- Detailed notes & @mentions per candidate / application  
- Interview scheduling:
  - Google/Microsoft calendar integration  
  - ICS-based invites as fallback  
- Client messaging threads (within the portal, stored in `events` / message tables)  
- Branded client subdomains (`agency.hire.io`) and basic white-labeling  
- Meilisearch integration for full-text & fuzzy search (jobs + candidates)  
- Alerts for:
  - New matches above a threshold  
  - Stage transitions  
  - Client inactivity on shortlists  
- Recruiter KPIs & performance analytics:
  - Placements, speed-to-first-touch, offer-to-hire ratios  

---

## Phase 3 — Growth Platform

**Goal:** Scale Hire.io into a full SaaS platform with **billing**, **more automation**, and robust multi-tenant controls.

### Features

- Stripe billing:
  - Multi-plan (starter/growth/enterprise)  
  - Per-seat pricing, agency-level limits  
- Advanced team management & permissions:
  - Fine-grained access (e.g. teams/regions)  
- Multi-brand/division support within a tenant  
- Workflow automation:
  - If/then triggers (e.g. “When client approves candidate, notify X and move stage to Y”)  
  - Scheduled automations (e.g. stale applications reminders)  
- “Hire.io Verified” badge:
  - For agencies or candidates meeting certain criteria  
- Advanced reporting (click-through analytics, channel attribution)  
- Data retention controls and legal audit logs  

---

## Phase 4 — Enterprise & API Ecosystem

**Goal:** Make Hire.io **extensible** and enterprise-ready.

### Features

- Public REST + GraphQL APIs for:
  - Jobs, candidates, applications, events, and analytics  
- API keys & usage metering (per tenant / partner)  
- Webhooks for major events (job created, candidate applied, stage changed, etc.)  
- SSO (Okta, Azure AD, Google, etc.)  
- SCIM provisioning for user management at scale  
- Multi-agency talent sharing network (controlled & consent-based)  
- Advanced white-label platform for large firms  
- Full SOC 2 readiness/compliance with supporting docs in `/docs/compliance/`  

---

## Phase 5 — AI Intelligence & Predictive Layer

**Goal:** Add **AI-driven insights** and predictive features layered on top of global + tenant data.

### Features

- Predictive analytics:
  - Time-to-fill forecasts  
  - Offer acceptance likelihood  
  - Candidate success likelihood for particular roles  
- Recruiter performance models and coaching suggestions  
- Market trends and heatmaps:
  - Skills in demand, salary bands, regional variations  
- Explainable AI recommendations:
  - “Why this candidate?” narratives for recruiters and clients  
- Adaptive matching:
  - Matching engine improves over time based on successful placements, hires, and feedback  
- Auto-sourcing AI agents:
  - Suggest potential candidates from global pool (only within consent constraints)  
  - Draft outreach messages and nurture campaigns  

---

## Phase 6 — Ecosystem & Marketplace

**Goal:** Build a connected ecosystem that **monetizes partnerships** and network effects.

### Features

- Partner marketplace:
  - Background checks, skill assessments, video interview tools, etc.  
- API licensing:
  - “Hire.io Verified” credential graph for 3rd-party tools  
- Recruiter community & template hub:
  - Shared intake templates, email sequences, scorecards  
- Affiliate and revenue share integrations  
- Platform-level analytics monetization:
  - Aggregated, anonymized labor market insights sold to partners (within privacy constraints)  

---

## Technical Stack Evolution

| Stage | Frontend | Backend | Data | AI | Hosting |
|-------|----------|---------|------|----|---------|
| MVP | Next.js + Tailwind | Supabase API + Next.js API Routes | Postgres (Supabase) | OpenAI | Vercel / Supabase |
| Beta | Next.js + Supabase + Meilisearch | Next.js API Routes | Postgres + Meilisearch | OpenAI | Vercel / Supabase |
| Growth | Next.js + NestJS | NestJS + Redis + Stripe | Postgres + Meilisearch + ClickHouse | OpenAI | AWS / similar |
| Enterprise | Next.js + Microservices | Kafka / queues + services | OpenSearch + ClickHouse | LangChain orchestration | AWS / GCP |
| AI Layer | Hybrid front + backend agents | GraphQL/API Gateway | Vector DB / embeddings | Custom / tuned LLMs | GPU Cloud |

---

## Architecture Overview (Summary)

See `docs/architecture.md` for detailed diagrams. At a high level:

- **Frontend**
  - Next.js (App Router)  
  - TailwindCSS (+ optional shadcn/ui)  
  - React Query / TanStack Query for data fetching  

- **Backend**
  - MVP: Next.js API routes + Supabase PostgREST  
  - Later: NestJS API, queues, and background workers  

- **Database**
  - Supabase Postgres with:
    - Multi-tenant RLS  
    - Global candidate support  
    - JSONB for flexible specs and skills  

- **AI Integrations**
  - OpenAI for:
    - Job intake  
    - Fit summaries  
    - Matching / pool analytics  

---

## Security & Compliance Framework

- Row-Level Security per tenant and role  
- Encrypted storage for resumes and sensitive data (Supabase Storage)  
- JWT-based sessions with `tenant_id` and `role` claims  
- AI-based redaction/anonymization for client-facing views  
- Full audit log for all major actions (`events` table)  
- GDPR/EEO/OFCCP-friendly designs (further detailed in `security-and-eeo.md`)  
- SOC 2 documentation templates and control mapping in `/docs/compliance/` (future)  

---

## Business Model

### Primary Revenue Streams

- SaaS subscriptions (per agency / per seat)  
- AI usage-based add-ons  
- SMS & skill verification add-ons  
- API licensing (Hire.io Verified)  
- Marketplace revenue share  

### Growth Strategy

1. Pilot with 3–5 agencies for testimonials and case studies.  
2. Expand via staffing associations, referrals, and niche verticals.  
3. Introduce billing, marketplace, and partner integrations.  
4. Scale via enterprise contracts and integrations.

---

## Recommended Folder Structure

```txt
hire-io/
├─ app/                      # Next.js app router
├─ components/               # Shared UI components
├─ lib/                      # Supabase client, auth helpers, etc.
├─ supabase/
│  └─ migrations/            # SQL migrations (incl. consolidated schema)
├─ docs/
│  ├─ roadmap.md             # This document (master plan)
│  ├─ architecture.md        # System diagrams, data model, RLS patterns
│  └─ security-and-eeo.md    # Bias prevention, legal/compliance logic
└─ README.md                 # Overview for repo visitors
## Usage & Governance Rules

This document defines the **entire Hire.io scope** and all **phase boundaries**.

### Rules for New Features
All new features MUST be mapped to:

1. **A specific roadmap phase (0–6)**  
2. **One or more core product modules:**  
   - Global Candidates  
   - ATS Core  
   - Client Portal  
   - Search & Matching  
   - AI Layer  
   - Analytics  
   - Integrations  

Any proposals **outside the current active phase** must be explicitly labeled as **future** and **NOT implemented yet**.

---

### When a Phase Is Complete

1. Mark all relevant checklist items as **done**.  
2. Add a short summary to:  
   - `/docs/history/<phase>-summary.md` (to be created)  
3. Update:  
   - `architecture.md`  
   - `security-and-eeo.md`  
   if the system’s behavior, data model, or compliance logic changed.

---

### Commit Message Convention

Use structured, phase-aware commit messages:

- `feat(phase1-ats): recruiter pipeline drag & drop`
- `fix(phase2-search): Meilisearch ranking bug`
- `chore(phase0-schema): tweak RLS for candidates`
- `docs(phase1): updated architecture diagram`
- `refactor(phase3-billing): improved Stripe webhook handling`

---

## Quick Reference: Phase-by-Phase Summary

| Phase | Core Deliverables | Output |
|-------|-------------------|--------|
| **0** | Infra, consolidated schema, docs | Repo + Supabase project wired up |
| **1** | Global candidates + core ATS + client portal + basic AI | MVP pilot for 3–5 agencies |
| **2** | Search, messaging, analytics, branded portals | Beta platform (10–20 agencies) |
| **3** | Billing, automation, verified layer | Self-serve SaaS with monetization |
| **4** | SSO, APIs, white-label, compliance | Enterprise-ready product |
| **5** | Predictive AI, insights, auto-sourcing | Intelligence layer on top of ATS |
| **6** | Marketplace, community, partnerships | Ecosystem & long-term moat |

---

## Final Note

Hire.io’s mission is to bring **transparency**, **fairness**, and **intelligence** to staffing —  
for agencies, clients, and candidates alike.

Every technical, design, and business decision should reinforce:

1. **Data Security**  
2. **Candidate Fairness**  
3. **Recruiter Efficiency**  
4. **Agency Profitability**

This document is your **master roadmap**.  
Keep it updated, keep it aligned, and use it to prevent scope creep as Hire.io grows.

---

*End of Master Product, Feature & Architecture Reference*
