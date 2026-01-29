# Docs Audits — Hire.io

This folder contains **documentation-to-repo reality audits**.

Audits exist to prevent drift from the Hire.io vision charter and to ensure Phase gates are enforced with evidence.

---

## Canonical Inputs (what audits must anchor to)

- `docs/vision.md` (Tier 1 — Non-Negotiable)
- `docs/checklists/phase-0-gate.md` (Phase-0 gate)
- `docs/roadmap.md` (sequencing + phase scope)
- `docs/architecture.md` (system boundaries)
- `docs/security-and-eeo.md` (EEO-blind + privacy constraints)
- `docs/phases/*` (phase definitions)
- Root `README.md` (repo orientation)

---

## Current Audits

### Phase 0
- `docs/audits/phase-0-drift-audit.md`
  - **Result:** FAIL
  - **Meaning:** Phase-0 constraints are defined, but repo reality still violates one or more gate items.
  - **Rule:** Phase-1 execution is **blocked** until Phase-0 gate items are verifiably satisfied.

---

## How to Use Audits

1) **Run / update an audit** when:
- a migration touches RLS, candidates, applications, clients, or events
- client portal routes change
- auth/role resolution changes
- docs claim “ready” or “complete”

2) **If an audit fails:**
- Update docs to reflect reality (if intended)
- OR schedule code/schema remediation (if docs are correct)
- Do not “declare Phase-0 complete” in any document until the gate passes.

---

## Final Rule

If a feature would require weakening the Phase-0 gate checklist, the feature is incorrect.

*End of audits index.*