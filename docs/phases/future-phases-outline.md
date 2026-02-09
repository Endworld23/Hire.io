# 🔭 Hire.io — Future Phases Outline (Non-Binding)

> **Status:** Informational / Guardrail Only
> **Authority:** Subordinate to `docs/vision.md`, `docs/checklists/phase-0-gate.md`, and active Phase execution docs
> **Purpose:** Define *intent and boundaries* for Phases 2–4 **without** locking design, schema, or execution details before Phase‑1 truth exists.

---

## 🚨 Important Framing

This document:

* **Does NOT** authorize implementation work
* **Does NOT** define schemas, APIs, or timelines
* **Does NOT** override Phase‑0 constraints or Phase‑1 execution

Its sole purpose is to:

* Prevent premature scope creep
* Capture *directional intent*
* Preserve architectural optionality

All future phases remain **blocked** until Phase‑1 exit criteria are met.

---

## Phase 2 — Beta (Production-Ready, Controlled Scale)

### Core Intent

Harden Hire.io for **real production usage at moderate scale** while preserving all Phase‑0 and Phase‑1 constraints.

Phase 2 exists to answer:

> “Can this system operate safely, repeatedly, and observably for dozens (not thousands) of tenants?”

### What Phase 2 Unlocks (Conceptual)

* Operational reliability
* Controlled scale
* Admin observability
* Tenant self-sufficiency

### Directional Capabilities (Non-Exhaustive)

* Bulk imports (CSV/XLS) **only if EEO-safe**
* Messaging & scheduling (candidate ↔ recruiter)
* Search performance improvements (indexing, caching)
* Branded client portals (still EEO-blind)
* Recruiter KPIs and productivity metrics

### Explicit Non-Goals

* No open marketplace
* No mass-apply mechanics
* No client access to raw resumes
* No cross-tenant visibility

### Phase 2 Entry Requirements

* Phase‑1 exit criteria fully satisfied
* RLS, EEO-blindness, and visibility bridge proven under real usage
* Phase‑1 discovery log reviewed and reconciled

---

## Phase 3 — Network Effects (Candidate-Centric Value)

### Core Intent

Shift Hire.io from *tenant-first ATS* to a **candidate-centric hiring network** — without recreating legacy job board failures.

Phase 3 exists to answer:

> “How do candidates gain leverage *without* becoming inventory?”

### Directional Capabilities (Conceptual)

* Candidate-controlled visibility & consent controls
* Cross-tenant opportunity matching **only via explicit opt-in**
* Skill verification & credibility layers
* Longitudinal candidate profiles (career arc, not resumes)

### Hard Constraints

* Candidates are **never browsable inventory**
* Employers still do not ‘search resumes’
* Visibility always requires consent + intent

### Phase 3 Entry Requirements

* Demonstrated candidate trust in Phase‑2 usage
* Proven non-exploitative incentive structures
* Clear regulatory posture (EEOC / GDPR / emerging AI laws)

---

## Phase 4 — Marketplace & Ecosystem (Optional / High-Risk)

### Core Intent

Only if prior phases succeed: enable **network-level coordination** between candidates, agencies, and employers.

Phase 4 exists to answer:

> “Can a hiring ecosystem exist without commoditizing people?”

### Directional Possibilities (Highly Speculative)

* Opportunity broadcasts (candidate-initiated)
* Reputation systems (for employers *and* agencies)
* Outcome-based pricing models
* Verified-skill marketplaces

### Explicit Warning

This phase carries the **highest risk** of violating the Vision Charter.

Execution is permitted **only if**:

* All prior phases reinforce candidate agency
* Incentives do not reintroduce volume-based abuse
* Governance and auditability scale with power

---

## ❗ What This Document Is NOT

* Not a roadmap
* Not a promise
* Not an execution plan
* Not a feature list

It is a **boundary document** that exists to protect Phase‑1 execution from future assumptions.

---

## 📌 Canonical References

* `docs/vision.md`
* `docs/checklists/phase-0-gate.md`
* `docs/phases/phase-1.md`
* `docs/execution/phase-1-execution-map.md`

---

## Final Rule

If any future-phase idea conflicts with Phase‑0 constraints or Phase‑1 discoveries, **the idea is wrong — not the system**.

*End of Future Phases Outline*
