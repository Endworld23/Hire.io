# 🏗️ Hire.io — System Architecture (MVP → Growth)

> **Version:** 1.1  
> **Pairs with:** [`docs/roadmap.md`](./roadmap.md)  
> **Audience:** Founders, engineers, AI coding agents (Bolt.new / Codex / Copilot)

This document explains *how* Hire.io is built and deployed from **MVP** through **Growth**. It focuses on:

- Component diagrams & request flows  
- **Global + multi-tenant** data model & RLS patterns  
- API surface (MVP routes) & eventing  
- Environment variables & secrets  
- Deployment, logging, backups, SLOs  

The **consolidated Supabase schema migration** is the authoritative source of truth for the database.
**Phase‑0 note:** A single canonical consolidated migration **must be explicitly declared**; current ambiguity is a known Phase‑0 deviation per `docs/audits/phase-0-drift-audit.md`.

---

## 1) High-Level Architecture

### 1.1 MVP (Bootstrap) — Minimal-Cost Stack

- **Frontend:** Next.js (App Router), Tailwind, (optionally) shadcn/ui, deployed on Vercel  
- **Backend:** Next.js API routes for thin server logic  
- **Data Platform:** Supabase (Postgres + Auth + Storage)  
- **Search:** Postgres FTS (later Meilisearch, but not required for Phase 1)  
- **AI:** OpenAI API (job intake Q&A, fit summaries, matching assistance)  
- **Email:** Resend or SendGrid (for invites, password reset, notifications)  
- **Auth model:** Supabase Auth sessions; enforcement uses `auth.uid()` with `public.users` lookups (per current implementation)  
- **Docs & CI:** `docs/` as system-of-record + GitHub Actions (lint/build/test)  

High level flow:

- Browser (Recruiter / Client / Candidate) → Next.js (Vercel)  
- Next.js API routes → Supabase (Postgres + Storage)  
- Next.js API routes → OpenAI (for AI flows)  
- Next.js API routes → Email provider (Resend/SendGrid)  

### 1.2 Growth — Productionized Stack (Future)

Later phases (Beta → Growth → Enterprise) may introduce:

- **Backend Services:** NestJS API (ECS/Fargate or similar), background workers (BullMQ/Redis)  
- **Search:** Meilisearch → OpenSearch (managed)  
- **Analytics:** ClickHouse + Metabase (dashboards)  
- **Storage/CDN:** S3 + CloudFront (or equivalent)  
- **Auth (Enterprise-ready):** Auth0/Cognito/SSO for large customers  
- **Observability:** APM + structured logs + metrics, central log store  

These are future layers and **not required** for Phase 0 / early Phase 1.

---

## 2) Request/Response Flows (MVP)

### 2.1 Candidate Upload → Global Profile → Tenant Application → EEO-Blind Client View

1. **Candidate creates / updates a global profile**
   - Candidate signs up (email or social login, e.g. LinkedIn) via Supabase Auth.  
   - `auth.users` record is created; `users` row is created with `role = 'candidate'` and **no `tenant_id`** (global candidate).  
   - Candidate uploads resume → Next.js API gets signed URL from Supabase Storage and stores metadata in `candidates`:
     - `user_id` → link to `users` (optional but recommended)  
     - `is_global = true`  
     - `owner_tenant_id = NULL` (not tenant-owned)  
     - `visibility.ai_opt_in` in a JSON `visibility` field  

2. **Recruiter imports or links candidate to a job**
   - Recruiter (tenant-scoped user: `tenant_id != NULL`) creates a job in `jobs`.  
   - Candidate either:
     - Applies to that job directly (self-service application), or  
     - Is imported / manually attached by the recruiter (if allowed by candidate visibility)  
   - An `applications` row is created: `tenant_id = job.tenant_id`, `job_id`, `candidate_id`, `stage = 'applied' | 'new'`, `score`, `match_score`.

3. **EEO-Blind client view**
   - Client user (role `client`) logs in; tenant/role resolved via `public.users` by `auth.uid()`.  
   - Client opens a shortlist page for a specific job.  
   - Client data access **must use a PII‑free access path** (RPC/view or query that never selects PII fields).  
   - Client sees **watermarked, anonymized** candidate cards; any view is logged to `events`.

### 2.2 Job Intake Q&A (AI)

- Recruiter fills a quick intake form for a job.  
- API route:
  - Builds a structured prompt using draft job spec + agency context.  
  - Calls OpenAI (or similar) to generate a **normalized job spec**.  
  - Persists this structured spec into `jobs.spec` (JSONB) and updates `required_skills` / `nice_to_have`.  
- This spec later drives:
  - Matching engine  
  - Pool gauge estimation  
  - Fit summaries

---

## 3) Data Model (MVP / Phase 1)

> The actual DDL lives in the consolidated Supabase migration. This section summarizes the model conceptually.

### 3.1 Key Tables (simplified)

    tenants(
      id uuid PK,
      name text,
      subdomain text unique,
      settings jsonb,
      created_at timestamptz
    )

    users(
      id uuid PK references auth.users,
      tenant_id uuid nullable references tenants,  -- null for global-only users (e.g. pure candidates)
      role text check in ('super_admin','admin','recruiter','client','candidate'),
      email text,
      full_name text,
      metadata jsonb,
      created_at timestamptz
    )

    jobs(
      id uuid PK,
      tenant_id uuid not null references tenants,
      title text,
      location text,
      salary_min integer,
      salary_max integer,
      required_skills jsonb,
      nice_to_have jsonb,
      spec jsonb,
      status text check in ('draft','active','closed','archived'),
      created_by uuid references users,
      created_at timestamptz
    )

    candidates(
      id uuid PK,
      user_id uuid nullable references users,      -- global candidate account link (if any)
      is_global boolean not null default true,     -- true = Hire.io global pool
      owner_tenant_id uuid nullable references tenants, -- tenant that imported candidate (if any)
      visibility jsonb,                            -- e.g. { "ai_opt_in": true, "allow_agency_reshares": true }
      public_id uuid unique,                       -- EEO-blind ID, client-facing
      full_name text,
      email text,
      phone text,
      location text,
      skills jsonb,
      experience jsonb,
      resume_url text,
      resume_text text,
      created_at timestamptz
    )

    applications(
      id uuid PK,
      tenant_id uuid not null references tenants,
      job_id uuid not null references jobs,
      candidate_id uuid not null references candidates,
      stage text check in (
        'new',
        'applied',
        'recruiter_screen',
        'screening',
        'submitted_to_client',
        'client_shortlisted',
        'client_rejected',
        'interview',
        'offer',
        'hired',
        'rejected'
      ),
      score numeric check (score >= 0 and score <= 100),
      match_score numeric,
      notes text,
      created_at timestamptz,
      unique(job_id, candidate_id)
    )

    stages(
      id uuid PK,
      tenant_id uuid not null references tenants,
      name text not null,
      "order" integer not null,
      created_at timestamptz,
      unique(tenant_id, name)
    )

    events(
      id uuid PK,
      tenant_id uuid not null references tenants,
      actor_user_id uuid nullable references users,
      entity_type text,
      entity_id uuid,
      action text,
      metadata jsonb,
      created_at timestamptz
    )

    skills(
      id uuid PK,
      name text unique,
      category text,
      created_at timestamptz
    )

    job_application_feedback(
      id uuid PK,
      tenant_id uuid not null references tenants,
      job_id uuid not null references jobs,
      application_id uuid not null references applications,
      author_user_id uuid nullable references users,
      rating integer check (rating between 1 and 5),
      comment text,
      created_at timestamptz
    )

#### Notes

- **Global vs tenant-owned candidates**
  - `is_global = true`, `owner_tenant_id = NULL` → pure global candidate, only visible:
    - To themselves (via `user_id`)  
    - To internal `super_admin` users for AI & marketplace features  
  - `is_global = true`, `owner_tenant_id = <tenant>` → candidate imported by a tenant and also in global pool.  
  - `is_global = false`, `owner_tenant_id = <tenant>` → tenant-only candidate (e.g. uploaded via bulk import).

- **Visibility**
  - `visibility` JSON is used to store consent flags (e.g. `ai_opt_in`, `pool_opt_in`, `share_with_other_tenants`) and can be extended over time.

- **Applications as the visibility bridge**
  - An `applications` row formally connects:
    - A tenant-owned job  
    - A candidate (global or tenant-only)  
  - Tenant recruiters/clients **see** candidates via their job’s applications, never the entire global pool.

- **JSONB for flexibility**
  - `skills`, `experience`, `spec`, `visibility`, and parts of `metadata` are stored as JSONB to iterate quickly on schema and AI-extracted structures.

### 3.2 Indices (examples)

    create index on users (tenant_id);
    create index on applications (tenant_id, job_id, candidate_id);
    create index on jobs (tenant_id, status);
    create index on jobs using gin (spec);
    create index on candidates using gin (skills);
    create index on candidates (owner_tenant_id, is_global);
    create index on events (tenant_id, entity_type, created_at desc);

These should already exist or be closely aligned with the consolidated schema migration.

### 3.3 Conceptual ERD

- **tenants** own:
  - `users` (tenant members)
  - `jobs`
  - `applications`
  - `stages`
  - `events`
  - `job_application_feedback`

- **Hire.io (global layer)** owns:
  - `candidates` (global or tenant-associated)
  - `skills` taxonomy
  - `super_admin` users (in `users` but with elevated role and usually no `tenant_id`)

- **Applications** are the bridge:
  - Connect a **tenant job** to a **candidate** (global or tenant-only).
  - Control who can see a candidate in which tenant.

---

## 4) Row-Level Security (RLS) — Patterns

RLS is enabled on **all tables**. Enforcement relies on:

- `auth.uid()` for session identity  
- Tenant/role resolved via `public.users` lookup  

### 4.1 Basic Patterns

- **Tenant isolation**:
  - Most tenant-bound tables (`jobs`, `applications`, `stages`, `events`, `job_application_feedback`) have policies like:

        using (tenant_id = (select tenant_id from public.users where id = auth.uid()))

- **Role-scoped writes**:
  - Write policies add role checks, e.g.:

        and (select role from public.users where id = auth.uid()) in ('admin','recruiter')

- **Global candidate pool restrictions**:
  - `super_admin` can see all candidates for internal purposes.
  - Tenants can see:
    - Candidates they imported (`owner_tenant_id = tenant_id`)  
    - Candidates attached to their jobs via `applications`  
  - Candidates can always access their own record via `user_id`.

### 4.2 Example Policy Sketches

Candidate self-access:

    alter table candidates enable row level security;

    create policy candidate_can_view_self
    on candidates for select
    to authenticated
    using (user_id = auth.uid());

    create policy candidate_can_update_self
    on candidates for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

Tenant recruiters accessing candidates linked to their jobs:

    create policy tenant_recruiters_can_view_applicant_candidates
    on candidates for select
    to authenticated
    using (
      (select role from public.users where id = auth.uid()) in ('admin','recruiter')
      and id in (
        select candidate_id
        from applications
        where tenant_id = (select tenant_id from public.users where id = auth.uid())
      )
    );

Super admin global visibility:

    create policy super_admin_can_view_all_candidates
    on candidates for select
    to authenticated
    using ((select role from public.users where id = auth.uid()) = 'super_admin');

> The actual RLS definitions live in the migration; this section describes how they are intended to behave.

---

## 5) API Surface (MVP)

Thin Next.js routes live under `apps/web/app/...` and may include server actions and route handlers. When route handlers are used, they live under `apps/web/app/api/*` and should:

- Validate input with Zod  
- Enforce role/tenant checks in addition to RLS  
- Call Supabase (PostgREST or client SDK)  
- Call OpenAI / email services as needed  

### 5.1 Jobs

- `POST /api/jobs`
  - Create job (tenant-scoped).  
  - Optionally call AI to normalize spec and populate `spec`, `required_skills`, `nice_to_have`.

- `GET /api/jobs`
  - List jobs for the authenticated tenant (filtered by status, search query).

- `GET /api/jobs/:id`
  - Get job details, including spec and basic pipeline stats (derived from applications).

### 5.2 Global Candidates & Tenant Imports

- `POST /api/candidates`  
  - If called without `tenant_id` context and role is `candidate`:
    - Create/update **global candidate** linked to `user_id`.
  - If called by a recruiter/admin with `tenant_id`:
    - Import candidate (sets `owner_tenant_id`) and optionally link to global candidate record.

- `GET /api/candidates/me`
  - Candidate fetches their own profile.

- `GET /api/tenant/candidates`
  - Recruiter/Admin fetches candidates they own (`owner_tenant_id`) or those linked to their jobs via applications.

### 5.3 Applications (Pipeline)

- `POST /api/applications`
  - Link candidate to job, stage defaults to `applied` or `new`.

- `PATCH /api/applications/:id`
  - Move stage, add notes, update `score`/`match_score`.

- `GET /api/jobs/:id/applications`
  - Pipeline list for a particular job (internal recruiter view).

### 5.4 Matching & Pool Gauge (AI-Driven)

- `POST /api/match`
  - Payload: `{ jobId, leniency }`  
  - Returns a ranked list of candidate IDs + match scores.

- `POST /api/pool-gauge`
  - Payload: `{ jobId, leniency }`  
  - Returns an aggregate “pool size” estimate (counts/percentiles), **not raw candidate identities**.  
  - Used for the **candidate pool gauge** UI.

- `POST /api/fit-summary`
  - Payload: `{ jobId, candidateId }`  
  - Returns a human-readable AI fit summary (internal recruiter view).

### 5.5 Client Portal

- `GET /api/client/jobs/:id/shortlist`
  - Returns EEO‑blind shortlist data **via a PII‑free access path** (no PII fields selected).

- `POST /api/client/feedback`
  - Client approves/rejects short-listed candidates or requests interviews.  
  - Writes into `applications.stage` and/or `job_application_feedback`.

---

## 6) Environment Variables (MVP)

Current repo usage:

    # Supabase
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
    SUPABASE_SECRET_KEY=...

    # OpenAI
    OPENAI_API_KEY=...

    # Email
    RESEND_API_KEY=...           # or SENDGRID_API_KEY

    # App
    NEXT_PUBLIC_APP_URL=https://app.hire.io

> **Secrets:** Never commit secrets to Git. Use Vercel/Supabase secret managers.

---

## 7) Non-Functional Requirements

### 7.1 Security

- HTTPS everywhere, HSTS via Vercel  
- Auth/RLS enforcement must match the implemented pattern (see Section 4)  
- RLS enforced on **every** table  
- Client contexts must never read PII fields (EEO‑blind is a data‑access rule)  
- PII redaction in AI prompts & client-facing outputs  
- Global candidate pool is only visible to `super_admin` and controlled AI flows, not directly to tenants.

### 7.2 Observability

- **MVP:** Supabase logs + Vercel logs  
- **Later:** Axiom/Datadog or similar for:
  - API latency  
  - Error tracking  
  - RLS / permission-denied anomalies  
  - AI call failures  

### 7.3 Performance Targets

- Page TTFB P95 < 500ms (MVP)  
- Core API P95 < 300ms where caching is possible (later)  
- AI calls allowed 2–5s with visible loading state  

### 7.4 SLOs (initial)

- Uptime: 99.5% (MVP), 99.9% (Growth)  
- RPO: ≤ 24h (MVP), ≤ 1h (Growth)  
- RTO: ≤ 24h (MVP), ≤ 2h (Growth)  

---

## 8) Backups & DR

### MVP

- Supabase automated daily backups for Postgres  
- Optional weekly export of core tables (`jobs`, `candidates`, `applications`) to storage (CSV/Parquet)  
- Restore playbook documented in `/docs/runbooks/backup-restore.md`  

### Growth

- RDS snapshots with PITR  
- S3 cross-region replication for file storage (resumes)  
- Infra-as-code (Terraform) to rebuild environments quickly  

---

## 9) Search & Matching Details

### 9.1 MVP (Postgres FTS / simple matching)

- Use `to_tsvector` on job + candidate text fields for basic search.  
- Matching rules:
  - Count required skills intersections  
  - Weight nice-to-have skills  
  - Adjust by years of experience  
  - Apply leniency slider as a threshold/weight parameter  

### 9.2 Growth (Meilisearch/OpenSearch)

- Index: candidates (skills, titles, experience summaries, location, seniority)  
- Ranking rules may include:
  1. Required skill matches  
  2. Nice-to-have matches  
  3. Recency (`updated_at`, `last_active`)  
  4. Past success signals (hired or high feedback)  

- Leniency slider:
  - Maps to thresholds (e.g. strict = must match N out of M required skills; lenient = allow partial matches with strong nice-to-have overlaps).

---

## 10) AI Interaction Contracts

### 10.1 Intake Calibration (Job Spec)

- Inputs:
  - Raw job description  
  - Company summary  
  - Location, salary hints  
  - Required vs nice-to-have skills  

- Output (stored in `jobs.spec`):

      {
        "title": "...",
        "location": "...",
        "salary_range": [min, max],
        "required_skills": ["", ""],
        "nice_to_have": ["", ""],
        "experience_years": 3,
        "remote": "hybrid|onsite|remote",
        "notes": "...",
        "seniority": "junior|mid|senior"
      }

### 10.2 Fit Summary

- Inputs:
  - Job spec (normalized JSON)  
  - Candidate structured profile (skills / experience / location)  

- Output:
  - 3–5 paragraphs and/or bullets explaining:
    - Strong matches  
    - Possible risks/gaps  
    - Recommended next step  

> Guardrails: never infer or mention race, gender, age, or any protected traits. Focus on skills, experience, and job requirements.

### 10.3 Pool Gauge

- Inputs:
  - Job spec  
  - Leniency level  

- Output:
  - Aggregate counts/estimates across **global + tenant-imported** candidates who meet thresholds, but **never raw identity lists**.

---

## 11) Client Portal — EEO-Blind Controls

- **Data access boundary (hard rule):** client contexts **must not read PII fields** at all (no server‑side selects/joins/RPCs that include PII).
- Client sees:
  - Alias via `public_id`  
  - Skill/experience summary  
  - High-level location (e.g. city/region)  
- Links:
  - Signed URLs with short TTL for any internal resume previews.  
- Viewer:
  - Use watermark overlays: `agency • client • timestamp`.  
- Events:
  - Every view, shortlist decision, and action emits an `events` row with metadata.

---

## Trust & Auditability Requirements

The platform must maintain a defensible audit trail for AI-assisted and human decisions. Minimum requirements:

- **Decision trace log:** Every material action (screening, rejection, shortlist changes, feedback) writes to `events`.  
- **Explainability metadata:** Store structured reasons and model inputs/outputs in `events.metadata` or adjacent tables.  
- **Compliance/jurisdiction flags:** Capture applicable rulesets (e.g., AEDT notices, consent state) per job/application.  
- **Immutable audit trail:** Audit entries are append-only and never edited in place.  

---

## 12) Deployment Plan

### 12.1 MVP

- **Frontend + API:** Next.js on Vercel  
- **Database/Auth/Storage:** Supabase project  
- **Email:** Resend or SendGrid  
- **AI:** OpenAI via API key  

### 12.2 Growth

- **API:** Dedicated NestJS service (ECS/Fargate)  
- **DB:** RDS Postgres with RLS-compatible configuration  
- **Search:** Meilisearch/OpenSearch  
- **Queues:** Redis/BullMQ  
- **Storage:** S3 + CloudFront  
- **Analytics:** ClickHouse + Metabase  
- **Infra:** Terraform-managed  

---

## 13) Phase Gates — Architecture Acceptance Criteria

**MVP / Phase 1 Done When:**

- [ ] Create tenant (agency) → invite recruiter → recruiter can create jobs.  
- [ ] Candidate can sign up globally and build a profile.  
- [ ] Candidate can apply to a tenant job; an `applications` row is created.  
- [ ] Recruiter can move candidate through stages via UI (`applications.stage`).  
- [ ] Client can view EEO‑blind shortlist for at least one job **without any PII reads**.  
- [ ] Matching endpoint returns ranked candidates for a job.  
- [ ] Pool gauge endpoint returns realistic candidate counts (even if approximate).  
- [ ] RLS tests confirm:
  - Tenants cannot see each other’s jobs/applicants.  
  - Tenants cannot see global pool directly.  
  - Candidates only see their own data.  
  - Super admins can see global data for operations.  

---

## 14) Open Questions / Future Notes

- Precise consent model for candidate visibility (`visibility` JSON schema).  
- When and how to allow agencies to “sponsor” a candidate into the global pool.  
- Job board integration (LinkedIn/Indeed) timelines and constraints.  
- Long-term design for metrics, dashboards, and recruiter KPIs.  
- Full-text vs vector search stack for semantic matching.

---

## 15) Quick Start (Dev)

    pnpm i
    # or npm install

    # set up .env.local with Supabase + OpenAI keys

    pnpm dev
    # opens web on http://localhost:3000

Seed scripts and test accounts (if present) should create:

- 1+ demo tenants  
- 1 admin + 1 recruiter + 1 client user per tenant  
- A handful of jobs, candidates, and applications  

---

## 16) Glossary

- **Global Candidate Pool:** Conceptual pool; global candidate data is future‑state (Phase 2+) unless explicitly implemented.  
- **Tenant:** A staffing agency or employer organization using Hire.io.  
- **EEO-Blind:** Client contexts must not read PII fields at the data access layer; UI masking is insufficient.  
- **Leniency Slider:** UI control that adjusts strictness of matching rules.  
- **Pool Gauge:** A visual indicator of how many candidates could plausibly match a job under current filters.  
- **RLS (Row-Level Security):** Database-enforced isolation and permissioning based on `auth.uid()` with `public.users` lookups (current implementation).  
- **Super Admin:** Internal Hire.io user with global operational access, used for support, troubleshooting, and internal AI features.

---

## ✅ Architecture Verification (Phase 0 / Phase 1)

- [ ] RLS tenant isolation proven in‑app (no cross‑tenant reads).  
- [ ] Client context uses **PII‑free** access paths only.  
- [ ] Applications bridge enables candidate visibility exactly as defined (imported or applied candidates only).  
- [ ] All material actions emit `events` (views, feedback, stage changes, AI actions).  

---
