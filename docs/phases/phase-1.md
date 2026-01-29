# 🚀 Hire.io — Phase 1: MVP (Pilot-Ready)

> **Phase:** 1  
> **Status:** Planned (BLOCKED until Phase‑0 Gate passes)  
> **Duration:** ~10–12 weeks  
> **Depends on:** Phase‑0 Gate pass  
> **Aligned With:** `docs/vision.md`, `docs/roadmap.md`, `docs/architecture.md`, `docs/security-and-eeo.md`

---

## ⛔ Phase‑0 Gate (Blocking)

**Phase 1 is BLOCKED until Phase‑0 Gate passes.**

Required references:
- `docs/checklists/phase-0-gate.md`
- `docs/audits/phase-0-drift-audit.md`

Known **CRITICAL blockers** (from the drift audit) that must be resolved before Phase‑1 execution can proceed:
- **Client portal PII access path** (EEO‑blind violation) — client shortlist must not read PII fields, not even server‑side.
- **Candidate visibility bridge not implemented** — applications must be the visibility bridge; tenant access must include applicants even when the candidate is global.

Phase‑1 work may proceed **only** in ways that keep the Phase‑0 gate constraints true and verifiable.

---

## 🎯 Phase 1 Goal (Execution Contract)

Deliver a **pilot‑ready MVP** that can be safely used by **3–5 real staffing agencies** while preserving the non‑negotiables in `docs/vision.md`.

**Pilot‑ready means:**
- Agencies can onboard, create jobs, and run real pipelines without manual intervention.
- Clients can review EEO‑blind shortlists without any PII access paths.
- Candidate visibility is controlled strictly by ownership or application linkage.
- All material actions are auditable in `events`.

This phase prioritizes **correctness, compliance, and usability** over depth, automation, or monetization.

---

## 🧱 Phase 1 Non‑Negotiables (Vision‑Aligned)

- **No mass‑apply mechanics** (ever).  
- **No global candidate browsing** by tenants/clients.  
- **Applications are the visibility bridge** (imported or applied candidates only).  
- **EEO‑blind client views** must **not read PII fields** (not merely hide them in UI).  
- **AI is assistive only** — never decides outcomes.  
- **Trust, auditability, defensibility** are the product.

---

## 🗂️ Scope

### ✅ In Scope (Phase 1)

- Global candidate sign‑up & profile management  
- Tenant onboarding (agency creation + invites)  
- Core ATS workflows (jobs, candidates, applications, pipeline)  
- Transparency/status system for candidate visibility  
- Compliant closure/feedback workflows  
- Job integrity signaling (freshness + intent indicators)  
- Calibrated job intake (realistic requirements)  
- Recruiter & admin dashboards  
- EEO‑blind client portal per job  
- Basic AI matching, leniency slider, pool gauge (v1)  
- Basic analytics (counts, funnels, time‑to‑fill)

### 🚫 Explicitly Out of Scope (Later Phases)

- Billing & subscriptions  
- Super‑admin cross‑tenant impersonation  
- Bulk imports (CSV/Excel)  
- Messaging threads & scheduling  
- White‑labeling & branded domains  
- Advanced automation & predictive analytics

---

## 🧭 Repo Structure (Monorepo Reality)

```
apps/web/app/...          # Next.js App Router pages/routes
apps/web/lib/...          # Server actions, auth helpers, utilities
packages/*                # Shared packages (schemas, ui, utils)
supabase/migrations/...   # Schema + RLS migrations
docs/...                  # Canonical documentation
```

All routing references in Phase 1 use `apps/web/app/...` (no `/app` at repo root).

---

## 📋 Phase 1 Modules & Acceptance Criteria

### 1) Authentication & Onboarding

**Deliverables**
- Candidate sign‑up/sign‑in (global candidates)
- Tenant onboarding (agency creation + invites)
- Role‑aware routing and profile resolution

**Acceptance Criteria**
- Correct role assigned on sign‑up/invite.
- Users land on role‑appropriate dashboards.
- **Auth/RLS behavior matches the implemented pattern described in** `docs/architecture.md` / `docs/security-and-eeo.md` (no assumptions about JWT claims unless explicitly implemented in Phase 1).

---

### 2) Core ATS (Per Tenant)

**Deliverables**
- Jobs: create/edit, status lifecycle (`draft → active → closed/archived`)
- Candidates & applications
- Pipeline stages with audit events

**Phase‑1 Build Requirements**
- **Applications bridge** for candidate visibility must work as defined in `docs/vision.md` (imported or applied candidates only).

**Acceptance Criteria**
- No cross‑tenant visibility possible in the app.
- Recruiters see only permitted candidate data.
- Stage changes write `events`.

---

### 3) Client Portal (EEO‑Blind)

**Deliverables**
- Client dashboard scoped per job
- Candidate cards using `public_id`
- Structured feedback actions (approve/reject/request interview)

**Phase‑1 Build Requirements**
- **No PII access paths** in client shortlist queries (no PII fields selected server‑side).

**Acceptance Criteria**
- Client cannot infer identity from data returned.
- Feedback updates application stage and logs `events`.

---

### 4) Search & Matching (v1)

**Deliverables**
- Internal recruiter search (jobs + candidates)
- Rules‑based/heuristic `match_score`
- Leniency slider
- Pool gauge (aggregate counts only)

**Acceptance Criteria**
- Client views never expose candidate identities.
- Pool gauge returns aggregates only, never raw candidates.

---

### 5) Notifications (v1)

**Deliverables**
- Email notifications: new application, client feedback, interview requested
- Templates stored in code

**Acceptance Criteria**
- Notifications are event‑driven and logged in `events`.

---

### 6) Analytics (v1)

**Deliverables**
- Active jobs count
- Applications per stage
- Funnel conversion per job
- Basic time‑to‑fill metric

**Acceptance Criteria**
- Derived strictly from live data.
- No predictive analytics in Phase 1.

---

## 🔐 Security & Compliance (Phase 1)

- Supabase RLS enforced on all reads/writes.
- Role checks mirrored in UI and server actions.
- EEO‑blind transformations enforced at the **data access layer** for client views.
- Audit logging via `events` for **all material actions**.

---

## 🧪 Phase 1 Readiness Checklist (Execution)

- [ ] Phase‑0 Gate passes per `docs/checklists/phase-0-gate.md`.
- [ ] Client portal **does not read PII fields** (no PII in select statements, RPCs, or server actions).
- [ ] Applications bridge works as defined in `docs/vision.md` **or** is explicitly implemented as a Phase‑1 requirement.
- [ ] All material actions write `events` logs (stage changes, feedback, shortlist views, AI actions).
- [ ] RLS tenant isolation is **proven in‑app**, not assumed.
- [ ] No global candidate browsing by tenant/client users.
- [ ] No mass‑apply mechanics.

---

## 🏁 Phase 1 Exit Criteria

Phase 1 is complete when:
- 3–5 agencies can pilot without manual intervention.
- A full hiring workflow runs end‑to‑end with **auditability** and **EEO‑blindness** intact.
- RLS, roles, and visibility bridge are verified via real usage.
- Codebase is stable and Phase‑2‑ready.

---

## 🔜 Next Phase

➡️ **Phase 2 — Beta (Production‑Ready)**

- Bulk imports  
- Messaging & scheduling  
- Search at scale  
- Branded portals  
- Recruiter KPIs

---

> Phase 1 is about **trust and proof**, not scale or polish.  
> If Phase 1 works correctly, Hire.io earns the right to grow.
