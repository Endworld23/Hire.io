# 🚀 Hire.io — Phase 1: MVP (Pilot-Ready)

> **Phase:** 1
> **Status:** Planned
> **Duration:** ~10–12 weeks
> **Depends on:** Phase 0 (Foundations complete)
> **Aligned With:** `docs/roadmap.md` (Master Product, Feature & Architecture Reference)

---

## 🎯 Phase 1 Goal

Phase 1 delivers a **pilot‑ready MVP** of Hire.io that can be safely used by **3–5 real staffing agencies**.

By the end of this phase, Hire.io must support:

* Global candidate onboarding (self‑service)
* A functional, tenant‑isolated ATS
* An EEO‑blind client portal per job
* First‑pass AI‑assisted matching, pool gauge, and fit summaries
* Recruiter‑usable dashboards backed by **real data only**

This phase prioritizes **correctness, compliance, and usability** over depth, automation, or monetization.

---

## 🧱 Phase 1 Principles (Non‑Negotiable)

* **Real data only** (no mocked dashboards)
* **Tables before charts**
* **RLS proven via UI usage**
* **Strict tenant + role isolation**
* **EEO‑blind by default for client views**
* **Pilot‑safe, not feature‑complete**

---

## ✅ Phase 1 Epics (Validated Problems)

* **Transparency/status system** for candidates (visibility into stage + closure)
* **Compliant closure/feedback** workflows and templates
* **Job integrity signals** (freshness + intent indicators)
* **Calibrated job intake** to reduce requirement inflation
* **Auditability baseline** (decision trace via `events`)

---

## 🗂️ In‑Scope vs Out‑of‑Scope

### ✅ In Scope (Phase 1)

* Global candidate sign‑up & profile management
* Tenant onboarding (agency creation + invites)
* Core ATS workflows (jobs, candidates, applications, pipeline)
* Transparency/status system for candidate visibility
* Compliant closure/feedback workflows
* Job integrity signaling (freshness + intent indicators)
* Calibrated job intake (realistic requirements)
* Recruiter & admin dashboards
* EEO‑blind client portal per job
* Basic AI matching, leniency slider, pool gauge (v1)
* Basic analytics (counts, funnels, time‑to‑fill)

### 🚫 Explicitly Out of Scope (Later Phases)

* Billing & subscriptions
* Super‑admin cross‑tenant impersonation
* Bulk imports (CSV/Excel)
* Messaging threads & scheduling
* White‑labeling & branded domains
* Advanced automation & predictive analytics

---

## 🚫 Non‑Goals (Prevent Over‑Automation)

* Fully automated hiring decisions without human review
* “Hands‑off” auto‑rejection at scale
* Black‑box AI outcomes without explainability or audit trails

---

## 🧭 Application & Dashboard Structure

```
/apps/web
  /app
    layout.tsx              # Protected dashboard shell
    page.tsx                # Dashboard landing
    /jobs
    /candidates
    /applications
    /pipeline
    /client
    /analytics
    /settings
```

All `/app/*` routes:

* Require authentication
* Resolve tenant + role from JWT
* Enforce RLS‑safe data access

---

## 🧩 Dashboard Technology (Phase 1)

### UI & Layout

* **shadcn/ui** (Radix + Tailwind)
* Shared App Shell (sidebar + topbar)

### Data Tables

* **TanStack Table**
* Server‑side pagination, sorting, filtering

### Charts & KPIs

* **Recharts** or **Tremor**
* Introduced only after tables are live

---

## 🧑‍💼 Roles Supported in Phase 1

### Candidate (Global)

* Sign up / sign in
* Create and manage global profile
* Apply to jobs
* Control visibility & consent flags

### Tenant Admin

* Create and manage jobs
* View all tenant candidates & applications
* Manage pipeline stages
* Invite recruiters & clients
* View tenant analytics

### Recruiter

* View assigned jobs
* Manage candidates & applications
* Move candidates through pipeline
* View AI fit summaries

### Client (EEO‑Blind)

* View anonymized candidates per job
* Approve / reject / request interview
* Provide structured feedback

> **Super Admin** capabilities are intentionally deferred to Phase 2.

---

## 📋 Phase 1 Module Breakdown

### 1️⃣ Authentication & Onboarding

**Global Candidates**

* Email + social login (e.g. LinkedIn)
* Global candidate profile tied to `users.id`

**Tenants**

* Agency creation flow
* Invite recruiters and clients
* Role‑aware JWT (`user_id`, `tenant_id`, `role`)

**Acceptance Criteria**

* Correct role assigned on sign‑up/invite
* Users land on role‑appropriate dashboard

---

### 2️⃣ Core ATS (Per Tenant)

**Jobs**

* Job creation & editing
* Status lifecycle: `draft → active → closed/archived`
* AI‑assisted intake Q&A (v1)

**Candidates & Applications**

* Global candidate self‑apply
* Recruiter‑created applications
* Application ↔ job linkage

**Pipeline**

* Stage‑based progression using `stages`
* Audit events written on transitions

**Acceptance Criteria**

* No cross‑tenant visibility possible
* Recruiters see only permitted data

---

### 3️⃣ Client Portal (EEO‑Blind)

* Client dashboard scoped per job
* Candidate cards using `public_id`
* No PII, no raw resume exports
* Feedback actions:

  * Approve
  * Reject
  * Request interview

**Acceptance Criteria**

* Client cannot infer identity
* Feedback updates application stage + logs event

---

### 4️⃣ Search & Matching (v1)

* Internal recruiter search (jobs + candidates)
* Rules‑based / heuristic `match_score`

**Leniency Slider**

* Adjusts required vs nice‑to‑have thresholds

**Pool Gauge (v1)**

* Aggregate counts only
* Global + tenant data
* No direct candidate exposure in client mode

**AI Fit Summaries**

* Pros / cons narrative for recruiter view

---

### 5️⃣ Notifications (v1)

* Email notifications:

  * New application
  * Client feedback
  * Interview requested

* Provider: Resend or SendGrid

* Templates stored in code

---

### 6️⃣ Analytics (v1)

**Recruiter / Admin Dashboards**

* Active jobs count
* Applications per stage
* Funnel conversion per job
* Basic time‑to‑fill metric

**Rules**

* Derived strictly from live data
* No predictive analytics yet

---

## 🔐 Security & Compliance (Phase 1)

* Supabase RLS enforced on all reads/writes
* Role checks mirrored in UI
* EEO‑blind transformations for client views
* Audit logging via `events` table

---

## 🧪 Phase 1 Validation Checklist

* [ ] Global candidate can sign up and manage profile
* [ ] Tenant admin can create jobs and invite users
* [ ] Recruiter can manage pipeline
* [ ] Client sees only EEO‑blind data
* [ ] Job postings show integrity signals (freshness + intent indicators)
* [ ] Candidate receives compliant closure on rejection with standardized templates
* [ ] Every rejection and shortlist action writes a traceable `events` log entry
* [ ] No cross‑tenant access possible
* [ ] Tables load real data
* [ ] Charts reflect table data

---

## 🏁 Phase 1 Exit Criteria

Phase 1 is complete when:

* Hire.io supports a **full hiring workflow** end‑to‑end
* 3–5 agencies can pilot without manual intervention
* RLS, roles, and EEO rules are proven via usage
* Codebase is stable and Phase 2‑ready

---

## 🔜 Next Phase

➡️ **Phase 2 — Beta (Production‑Ready)**

* Bulk imports
* Messaging & scheduling
* Search at scale
* Branded portals
* Recruiter KPIs

---

> Phase 1 is about **trust and proof**, not scale or polish.
> If Phase 1 works correctly, Hire.io earns the right to grow.
