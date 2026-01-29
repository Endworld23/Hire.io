# Hire.io — Master Product Roadmap & Platform Strategy

> **Status:** Canonical
> **Owner:** Aaron Martin
> **Last Updated:** January 2026
>
> This document defines **what Hire.io is building, why it exists, and how it evolves over time**.
> It is the authoritative roadmap governing **all product, architecture, AI, and business decisions**.
>
> All implementation must align with:
>
> * `docs/vision.md` (non‑negotiable intent)
> * `docs/architecture.md` (system constraints)
> * `docs/security-and-eeo.md` (legal + ethical guardrails)

---

## 1. Vision Alignment (Read This First)

Hire.io exists to **invert the hiring market**.

Today’s hiring stack forces candidates to chase employers through opaque systems optimized for volume, risk avoidance, and compliance theater. This creates burnout for candidates and operational overload for employers.

**Hire.io reverses this dynamic.**

We start by empowering staffing agencies with a modern, compliant ATS — not to preserve the status quo, but to **build the infrastructure required for a candidate‑first hiring economy** where:

* Individuals invest in themselves, not keyword games
* Employers compete for qualified, consenting talent
* Transparency replaces silence
* Compliance enables trust instead of fear

> The B2B ATS is the foundation.
> The B2C marketplace is the outcome — **not the starting point**.

This roadmap enforces that sequencing.

---

## 2. Product Strategy at a Glance

Hire.io evolves in **deliberate layers**, each unlocking the next without breaking trust, legality, or incentives.

| Layer                           | Purpose                       | Why It Comes First                      |
| ------------------------------- | ----------------------------- | --------------------------------------- |
| **B2B ATS (Core)**              | Control hiring workflows      | Required to influence employer behavior |
| **Trust & Transparency**        | Reduce noise, restore dignity | Prevents volume collapse                |
| **Compliance & Auditability**   | Make adoption safe            | Removes employer fear                   |
| **Intelligence Layer**          | Improve outcomes              | Only works with clean signals           |
| **Candidate‑First Marketplace** | Invert power                  | Impossible without prior layers         |

---

## 3. Core Platform Pillars

### Pillar A — Multi‑Tenant ATS (Foundation)

* Tenant‑isolated agencies
* Recruiter‑driven workflows
* EEO‑blind client interaction
* Immutable audit trails

This is the **control plane** of Hire.io.

---

### Pillar B — Global Candidate Graph (Deferred Access)

* Unified candidate profiles
* Skills, experience, and consent‑driven visibility
* No open search
* No résumé scraping

Candidates are **never exposed without context, consent, and purpose**.

---

### Pillar C — Trust & Integrity Layer

* Job freshness signals
* Intent attestation
* Closure guarantees
* Explainable rejection categories

Trust is treated as infrastructure, not UX polish.

---

### Pillar D — Assistive AI (Not Decision‑Making AI)

* Intake calibration
* Fit narratives
* Pool realism gauges
* Decision support only

AI **never replaces human judgment**.

---

## 4. Phase Roadmap (Authoritative)

### Phase 0 — Foundations (Complete)

**Purpose:** Build the system that prevents future mistakes.

Delivered:

* Canonical schema + RLS
* Security & EEO framework
* Architecture documentation
* Phase discipline

No features. No shortcuts.

---

### Phase 1 — MVP (Pilot ATS)

**Purpose:** Prove that transparency reduces noise without increasing risk.

Scope:

* Global candidate onboarding
* Tenant ATS (jobs, candidates, applications)
* EEO‑blind client portal
* Status transparency & compliant closure
* Basic matching, leniency slider, pool gauge

Success is measured by:

* Reduced low‑fit applications
* Faster time‑to‑fill
* Candidate trust signals

---

### Phase 2 — Beta (Operational Trust)

**Purpose:** Make Hire.io indispensable to daily agency operations.

Adds:

* Bulk imports
* Notes & collaboration
* Interview scheduling
* Branded client portals
* Search at scale

Marketplace access is **still prohibited**.

---

### Phase 3 — Growth (Economic Engine)

**Purpose:** Turn trust into a sustainable business.

Adds:

* Billing & plans
* Automation (rules, triggers)
* Verified signals
* Advanced reporting

Agencies pay for **outcomes**, not volume.

---

### Phase 4 — Enterprise & Platformization

**Purpose:** Make Hire.io extensible and defensible.

Adds:

* APIs & webhooks
* SSO & SCIM
* White‑labeling
* SOC 2 readiness

---

### Phase 5 — Intelligence Layer

**Purpose:** Improve outcomes, not replace humans.

Adds:

* Predictive insights
* Market intelligence
* Explainable recommendations

Only built once signals are clean.

---

### Phase 6 — Candidate‑First Marketplace

**Purpose:** Complete the inversion.

At this stage:

* Candidates opt into discovery
* Employers compete for vetted talent
* Matching is invitation‑based
* Power asymmetry is reduced

This phase **cannot be rushed**.

---

## 5. Explicit Prohibitions (Non‑Negotiable)

Hire.io will **never**:

* Operate as a mass job board
* Allow blind résumé search
* Sell candidate data
* Automate rejection without explanation
* Claim “bias‑free AI”
* Replace recruiters with automation

Any proposal violating these rules is invalid by default.

---

## 6. Governance Rules

All work must map to:

1. A single roadmap phase
2. A core pillar
3. A trust or efficiency outcome

If it does not clearly serve one of these, it does not ship.

---

## 7. How to Use This Document

* Product decisions → validate against this roadmap
* Engineering decisions → check phase eligibility
* AI prompts → inherit constraints from here
* Marketing copy → must not promise beyond current phase

This document exists to **prevent drift, hype, and accidental harm**.

---

## Final Statement

Hire.io is not here to optimize hiring funnels.

It exists to **change who hiring works for — without breaking the system that must adopt it first**.

This roadmap is the contract that makes that possible.
