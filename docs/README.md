# Hire.io — Documentation Guide

> **Status:** Canonical documentation index
> **Audience:** Founders, engineers, AI coding agents, contributors
> **Purpose:** Explain how Hire.io documentation is structured, how it should be interpreted, and which documents override others.

This file is the **entry point for all documentation inside `/docs`**.

---

## 1. How to Read These Docs (Very Important)

Hire.io documentation is intentionally structured to **prevent product drift**, especially toward legacy job-board patterns.

Not all documents are equal.

Some define **non-negotiable intent**, others describe **execution**, and others exist only for **reference or operations**.

If there is ever a conflict between documents, **this hierarchy determines what is correct**.

---

## 2. Documentation Hierarchy (Order of Authority)

### Tier 1 — Vision & Non-Negotiables (Overrides All)

These documents encode *what Hire.io is* and *what it will never become*.

* **`vision.md`**
  Canonical vision, industry inversion, and explicit anti-patterns.
  If a proposal or implementation conflicts with this document, it is incorrect.

---

### Tier 2 — System Truth (Architecture & Constraints)

These documents define *how* the system is allowed to work.

* **`architecture.md`**
  System design, boundaries, data ownership, and service responsibilities.

* **`security-and-eeo.md`**
  Tenant isolation, bias minimization, auditability, and compliance constraints.

These documents must align with `vision.md` and may not violate it.

---

### Tier 3 — Product Sequencing (Roadmap & Phases)

These documents define *when* and *in what order* capabilities are introduced.

* **`roadmap.md`**
  Long-term sequencing and phase intent.

* **`phases/phase-0.md`**
  Historical foundation work (immutable).

* **`phases/phase-1.md`**
  Pilot MVP execution plan.

* **`phases/phase-2.md`** and beyond
  Future phases, always constrained by vision.

Phase documents may **scope features**, but may not contradict Tier 1 or Tier 2 documents.

---

### Tier 4 — Operations & Runbooks

These documents explain *what to do when something goes wrong*.

* **`runbooks/incident-response.md`**
* **`runbooks/data-deletion.md`**
* **`runbooks/backup-restore.md`**
* **`runbooks/ai-bias-audit.md`**

Runbooks are practical, procedural, and intentionally non-philosophical.

---

### Tier 5 — Research & Reference

These documents explain *why certain decisions were made*, but do not define execution.

* **`research/market-validation.md`**
* **`research/assumptions-and-risks.md`**

They inform roadmap decisions but do not override them.

---

## 3. Core Principles Every Document Must Respect

All documentation and implementation must preserve the following principles:

* **B2B-first, multi-tenant ATS is foundational**
* **Candidate discovery flows employer → candidate**
* **Candidates are durable profiles, not disposable résumés**
* **Tenant isolation is non-negotiable**
* **Existence does not imply visibility**
* **Bias reduction is structural, not optional**
* **AI assists clarity; humans retain authority**

If a document or feature undermines these principles, it should not exist.

---

## 4. How AI Coding Agents Should Use These Docs

AI agents (including Codex) must:

1. Read `vision.md` **before writing or modifying code**
2. Treat tenant isolation, EEO-blindness, and auditability as hard constraints
3. Avoid introducing open candidate search or mass-apply mechanics
4. Ask for clarification if a task risks violating the vision

If an AI-generated change recreates job-board behavior, it is considered a failure.

---

## 5. How to Add or Modify Documentation

When adding or updating documentation:

* Identify which tier the document belongs to
* Do not duplicate content that belongs in a higher tier
* Prefer clarity over completeness
* Keep vision and execution separate

### Creating a New Phase Doc

A phase document **must** answer:

1. What is the goal of this phase?
2. What is explicitly in scope?
3. What is explicitly out of scope?
4. What does “done” mean?

### Creating a New Runbook

A runbook **must** include:

* Trigger condition
* Immediate actions
* Decision tree
* Escalation path
* Logging and evidence requirements

---

## 6. How to Resolve Conflicts or Ambiguity

If there is uncertainty:

1. Check `vision.md`
2. Check `architecture.md` and `security-and-eeo.md`
3. Check the relevant phase document

If ambiguity remains, **do not assume**. Clarify before building.

---

## 7. Final Rule

Hire.io documentation exists to **protect intent, not justify shortcuts**.

If something is easy to build but violates the vision, it should not be built.

This file exists so future contributors do not have to rediscover that the hard way.
