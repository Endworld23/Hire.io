# Hire.io — Phase 0 Gate Checklist (Non-Drift Enforcement)

> **Status:** Required before Phase 1 execution
> **Owner:** Aaron Martin
> **Last Updated:** January 2026
> **Purpose:** Provide an explicit, repeatable checklist to verify that Phase 0 foundations are complete and that the platform cannot drift into legacy hiring anti-patterns.

This checklist is **not aspirational**.
Every item must be verifiably true before Phase 1 is considered unblocked.
**PASS** = satisfied now with evidence.  
**DEFERRAL** = explicitly documented in `docs/phases/phase-0.md` and `docs/audits/phase-0-drift-audit.md`, and enforced as a Phase‑1 requirement in `docs/phases/phase-1.md` without weakening Phase‑0 constraints.

---

## 1. Documentation Alignment (Canonical Truth)

☐ `docs/vision.md` exists, is current, and is referenced by other docs  
☐ `docs/roadmap.md` enforces B2B‑first sequencing and marketplace gating  
☐ `docs/architecture.md` reflects actual system boundaries and enforcement model  
☐ `docs/security-and-eeo.md` encodes EEO‑blind and privacy constraints  
☐ `docs/readme.md` explains doc hierarchy and authority  
☐ No contradictory “source of truth” documents exist elsewhere in the repo  

**Fail condition:** Any two docs describe conflicting behavior

---

## 2. Repo Structure & Tooling

☐ `supabase/migrations/` is the single authoritative schema history  
☐ A consolidated schema migration exists and is declared canonical  
☐ Lint/build scripts pass without warnings that hide real issues  
☐ Environment variables are documented and minimal  
☐ No hard-coded secrets exist in the repo  

---

## 3. Database & Row Level Security (RLS)

☐ RLS is enabled on **all** tenant‑sensitive tables  
☐ No table with PII is readable without an RLS policy  
☐ Cross‑tenant reads are impossible using anon/auth keys  
☐ Policies are role‑aware (`super_admin`, `admin`, `recruiter`, `client`, `candidate`)  
☐ Enforcement matches the implemented pattern (see `docs/architecture.md`)  

### Tenant Isolation

☐ Tenant data is scoped by `tenant_id` at the database layer  
☐ No UI‑only checks are relied on for isolation  

---

## 4. Candidate Visibility Model (Critical)

☐ Candidates are visible to a tenant **only** if:

* imported by that tenant, **or**
* linked via an application to one of that tenant’s jobs

☐ No global candidate browsing endpoint exists  
☐ No wildcard candidate search exists outside tenant scope  
☐ Aggregate pool metrics do **not** expose identities  
☐ No tenant/client endpoints enable global candidate enumeration  

**Fail condition:** Any route allows tenant users to enumerate global candidates

---

## 5. EEO-Blind Client Access

☐ Client contexts **must not read/select PII fields** (name, email, phone, raw resume text)  
☐ Client views are job‑scoped only  
☐ Candidate identifiers are pseudonymous (`public_id`)  
☐ Resume/document views are redacted and watermarked  
☐ Client actions (view, approve, reject) are logged  

**Fail condition:** Any client‑context query selects PII fields, even if UI masking exists.

---

## 6. Candidate Self-Ownership

☐ Candidates can read/update **only** their own profile via `auth.uid()`  
☐ Candidates cannot see other candidates  
☐ Candidates cannot see tenant analytics or pipelines  

---

## 7. Events & Auditability

☐ `events` (or equivalent) table exists and is append‑only by policy  
☐ Core actions emit events:

* application stage changes
* client feedback actions
* candidate profile views (client/recruiter context)

☐ Events include: actor, role, tenant, target entity, timestamp  

---

## 8. AI Guardrails (Foundation Only)

☐ AI usage is **assistive only** (no autonomous decisions)  
☐ Prompts are documented and sanitized  
☐ No PII is passed to AI in client contexts  
☐ AI calls are logged (model, timestamp; no raw content)  

---

## 9. Explicit Anti-Patterns (Hard Stops)

Confirm the system does **not** contain:

☐ Mass-apply mechanics
☐ Open résumé search
☐ Keyword-only ranking systems
☐ Silent rejections without status updates
☐ Volume-based monetization hooks

**Fail condition:** Any feature incentivizes application volume over fit

---

## 10. Phase 1 Readiness Declaration

☐ All checklist items above are complete  
☐ Known gaps are documented and explicitly deferred to Phase 1  
☐ No Phase 1 feature requires violating Phase 0 constraints  

**Gate Enforcement:** Phase‑1 implementation may proceed only if it does not violate any item above.  
Known deferrals must be tracked in `docs/phases/phase-0.md` and `docs/audits/phase-0-drift-audit.md`, and enforced as Phase‑1 requirements in `docs/phases/phase-1.md` without weakening constraints.

Once all boxes are checked, Phase 1 execution may begin.

---

## Final Rule

If a Phase 1 implementation would require unchecking any item in this checklist, the implementation is incorrect — even if it appears to work.

This checklist exists to protect Hire.io from becoming the system it was designed to replace.

*End of Phase 0 Gate Checklist*
