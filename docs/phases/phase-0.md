# Hire.io — Phase 0: Foundations (Truth, Safety, and Non‑Drift)

> **Status:** Re-baselined
> **Owner:** Aaron Martin
> **Last Updated:** January 2026
> **Canonical Inputs:** `docs/vision.md`, `docs/roadmap.md`, `docs/architecture.md`, `docs/security-and-eeo.md`
>
> **Purpose (Phase 0):** Create a foundation that makes it **hard to accidentally build an Indeed/ZipRecruiter clone**.
>
> Phase 0 is the platform’s **non-negotiable scaffolding**: tenancy, security, EEO-blindness, auditability, and documentation discipline.

---

## 0.1 What Phase 0 Is (and Isn’t)

### Phase 0 is:

* A **governance and infrastructure** phase
* The place where we lock in constraints that protect the vision
* The phase where the schema + RLS become a defensible “contract”

### Phase 0 is not:

* Feature delivery
* Product polish
* A marketplace launch
* “Just enough docs”

If Phase 0 is done correctly, Phase 1 becomes straightforward — and later phases cannot drift into legacy hiring anti-patterns.

---

## 0.2 Phase 0 Non‑Negotiables (Derived from Vision)

These constraints must be true **before** Phase 1 ships:

1. **No mass-apply mechanics** (no one-click apply amplification)
2. **No open candidate browsing/search** of the global pool
3. **Applications are the visibility bridge** (tenants see candidates only via import or job application linkage)
4. **EEO-blind client views are default** (PII never appears in client context)
5. **Auditability is real** (material actions emit immutable events)
6. **Tenant isolation is provable** (RLS + tests + UI verification)

---

## 0.3 Deliverables (Authoritative)

Phase 0 is complete only when all deliverables below are satisfied.

### A) Documentation System (Repo as Source of Truth)

Required docs (must exist and be internally consistent):

* `docs/vision.md` — industry inversion charter (canonical)
* `docs/roadmap.md` — phase sequencing + prohibitions (canonical)
* `docs/architecture.md` — system design, flows, data model, RLS patterns
* `docs/security-and-eeo.md` — privacy, EEO-blind rules, AI guardrails
* `docs/readme.md` — how to navigate docs and which files are canonical

Docs governance:

* Each doc has: status, owner, last updated
* No duplicate “sources of truth”
* Any PR changing data flows must update the relevant docs

### B) Repo Structure and Build Discipline

Repo must have clear structure and stable tooling:

* Next.js app structure established
* `supabase/migrations/` is canonical for schema history
* Environment variable conventions documented
* Lint/build scripts run cleanly

### C) Database Contract (Schema + RLS)

The database is the enforcement layer. Phase 0 requires:

1. **Consolidated schema migration exists and is authoritative**

* Location: `supabase/migrations/<timestamp>_consolidated_schema.sql`
* All tables have explicit RLS enablement

2. **Tenant isolation policies exist and are consistent**

* Tenant tables must enforce `tenant_id` scoping at the DB layer

3. **Visibility bridge is enforced**

* Tenants can only see:

  * Candidates they imported (`owner_tenant_id = tenant_id`), and/or
  * Candidates linked via `applications` within their tenant

4. **Candidate self-ownership is enforced**

* Candidates can view/update their own candidate record via `user_id = auth.uid()`

5. **Client role is EEO-blind**

* Client reads must exclude PII fields in server responses
* Client access must be job-scoped

6. **Events/audit trail is append-only by policy**

* Core actions must emit `events` (or equivalent)

### D) Security, Privacy, and AI Guardrails (Baseline)

Phase 0 locks in rules that prevent future harm:

* PII redaction rules documented
* Client portal redaction rules documented
* AI prompt safety constraints documented
* Logging standards documented (PII removed; model + template IDs tracked)

### E) Local + Hosted Environment Readiness

Must be documented (even if development is not local-first):

* `.env.example` or clear env docs
* How to point the app to Supabase
* How migrations are applied
* Vercel deployment expectations and required secrets

---

## 0.4 “Done” Definition (Acceptance Criteria)

Phase 0 is done when:

* [ ] All canonical docs exist and are aligned (no contradictions)
* [ ] Repo docs have a single navigation entry (`docs/readme.md`)
* [ ] Consolidated schema migration exists and reflects reality
* [ ] RLS enabled on all tenant-sensitive tables
* [ ] Cross-tenant reads are impossible using anon/auth keys
* [ ] Candidate self-access works (read/update) and is isolated
* [ ] Client role cannot retrieve PII in any route
* [ ] Events are written for core actions (at least: stage change, client feedback, candidate view)
* [ ] A “drift audit checklist” exists and can be rerun before major releases

---

## 0.5 What Phase 0 Explicitly Does Not Include

Phase 0 excludes:

* Full auth onboarding UX polish
* Resume parsing + extraction pipelines
* Matching engine beyond definitions
* Notifications (email/SMS)
* Billing
* Integrations (calendar, job boards)
* Marketplace mechanics

Those belong to Phase 1+ and must be gated by the vision constraints above.

---

## 0.6 Phase 0 Outputs (What We Expect to Have in the Repo)

Minimum expected file set:

* `README.md`
* `docs/readme.md`
* `docs/vision.md`
* `docs/roadmap.md`
* `docs/architecture.md`
* `docs/security-and-eeo.md`
* `docs/phases/phase-0.md` (this doc)
* `docs/phases/phase-1.md`
* `docs/runbooks/*` (placeholders allowed, but indexed)
* `docs/compliance/*` (SOC2 checklist + policies)

---

## 0.7 Next: Phase 1 Readiness Gate

We do **not** start Phase 1 execution until Phase 0 acceptance criteria are green.

Phase 1 begins once:

* the platform cannot drift into open resume browsing,
* client views cannot leak identity,
* and multi-tenant isolation is demonstrably enforced.

---

*End of Phase 0 Foundations (Truth, Safety, and Non‑Drift)*
