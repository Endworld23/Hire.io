# Hire.io

> **Status:** Phase 0 complete · Phase 1 in progress
> **Product Type:** B2B-first, multi-tenant ATS and hiring infrastructure platform

Hire.io is a **B2B-first hiring infrastructure platform** designed to reverse the traditional hiring model.

Instead of candidates endlessly applying to job boards, **Hire.io enables employers and staffing agencies to discover qualified candidates through calibrated demand, trust-preserving workflows, and bias-minimized review**.

Hire.io is not a job board.
Hire.io is not a résumé database.

It is a **multi-tenant ATS for staffing agencies** that intentionally lays the groundwork for a future, permissioned candidate network where discovery flows from employer → candidate.

---

## Where to Start (Important)

If you are new to this repository, read these in order:

1. **`docs/vision.md`** — Canonical vision and non-negotiable constraints
2. **`docs/roadmap.md`** — Phases and long-term sequencing
3. **`docs/architecture.md`** — System design and data boundaries
4. **`docs/security-and-eeo.md`** — Bias minimization and compliance model

The rest of the documentation derives from those documents.

---

## Product Overview

Hire.io is built around a **two-layer model**:

### 1. Tenant Layer (Foundational — B2B)

A fully isolated, multi-tenant ATS for staffing agencies and employers, providing:

* Job intake and calibration
* Recruiter pipelines and workflows
* EEO-blind client review portals
* Candidate application management
* Audit logs and compliance artifacts

This layer must stand alone as a viable SaaS product.

### 2. Global Candidate Layer (Derived — Permissioned)

A Hire.io-managed candidate network that:

* Allows candidates to maintain a single, durable profile
* Requires explicit consent for discovery
* Does **not** allow open browsing or résumé search
* Enables aggregate pool insights without identity exposure

The global layer is intentionally constrained and evolves only after trust is established at the tenant layer.

---

## Current Phase

### Phase 0 — Foundation (Complete)

Phase 0 focused on **structure, correctness, and constraints**, not production features.

Completed work includes:

* Authoritative multi-tenant database schema
* Row Level Security (RLS) enforcing tenant isolation
* Core UI components and demo flows
* Architecture, security, and compliance documentation

### Phase 1 — Pilot MVP (In Progress)

Phase 1 transitions the system from demo to **real, end-to-end workflows**:

* Supabase authentication and role-based access
* Real candidate profiles and applications
* Tenant onboarding and recruiter workflows
* EEO-blind client-facing review flows
* Initial (guardrailed) AI-assisted matching

> Note: Some AI and matching logic remains mocked or heuristic-driven during early Phase 1. UX and system boundaries take priority over optimization.

---

## Core Principles Encoded in This Repo

* **Tenant isolation is non-negotiable**
* **Candidates are durable profiles, not disposable résumés**
* **Discovery flows employer → candidate**
* **Bias is reduced structurally, not optionally**
* **AI assists clarity; humans retain authority**
* **Existence does not imply visibility**

Any implementation that violates these principles is incorrect, even if it “works.”

---

## Feature Surface (Representative, Not Exhaustive)

### Tenant / Agency Capabilities

* Job intake wizard with calibrated requirements
* Leniency slider to control matching strictness
* Structured salary ranges
* Recruiter pipelines and stage management
* EEO-blind candidate shortlists for clients
* Structured application feedback
* Event and audit logging

### Candidate Capabilities

* Guided profile onboarding
* Resume upload and parsing (Phase 1)
* Structured skills and experience storage
* Application status transparency
* Global account without tenant membership

### Internal / Platform Capabilities

* Tenant management
* Global candidate governance
* Compliance and audit tooling
* AI usage logging and review

---

## Technology Stack

* **Frontend:** Next.js 16, React 19, TypeScript (strict), Tailwind CSS
* **Backend:** Supabase (PostgreSQL, Auth, Storage)
* **Security:** PostgreSQL Row Level Security (RLS)
* **Infrastructure:** Vercel + Supabase

---

## Getting Started (Development)

### Prerequisites

* Node.js 18+
* Supabase project

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install & Run

```
npm install
npm run dev
```

Local app:

* [http://localhost:3000](http://localhost:3000)

---

## Demo Mode (Phase 0 Artifact)

The `/demo` route provides a **UI-only walkthrough** of the intended workflows:

* Job intake
* Candidate application
* Anonymized client review
* Mock AI-style matching

This demo illustrates **intent and UX**, not production logic.

---

## Project Structure (Simplified)

```
hire-io/
├── app/                    # Next.js app router
├── components/             # Reusable UI components
├── lib/                    # Supabase + shared utilities
├── supabase/
│   └── migrations/         # Authoritative database schema
├── docs/                   # Canonical documentation
└── README.md
```

---

## Database Model (High-Level)

Key tables include:

* `tenants` — Staffing agencies / employers
* `users` — Authenticated users (tenant or global)
* `jobs` — Tenant-owned job requisitions
* `candidates` — Global or tenant-imported candidate profiles
* `applications` — Visibility bridge between jobs and candidates
* `stages` — Tenant-defined pipelines
* `events` — Audit log
* `job_application_feedback` — Structured review data

All tables enforce RLS to preserve isolation, privacy, and trust.

---

## Contributing Guidelines

During Phase 1:

* Follow the roadmap and vision documents
* Do not introduce open candidate browsing
* Maintain strict TypeScript usage
* Add RLS policies for any new table
* Update `/docs` when behavior changes

If a change conflicts with `docs/vision.md`, it should not be merged.

---

## License

**Proprietary — All rights reserved.**
