# Hire.io — Phase 1 Execution Map

## 1) Purpose

- Prevent drift from Vision and Phase‑0 constraints during Phase‑1 implementation.
- Enforce EEO‑blindness as a data‑access rule, not a UI convention.
- Prove RLS isolation in‑app before adding more feature surface.
- Provide a verifiable build sequence tied to Phase‑0 Gate and drift audit.
- Keep Phase‑1 work auditable and compatible with the execution contract.

---

## 2) Non‑Negotiable Constraints (carry‑forward)

- No mass‑apply mechanics.
- No tenant/client global candidate browsing or enumeration.
- Applications are the **only** visibility bridge (imported or applied candidates only).
- Client contexts must have **zero PII reads** (data‑access rule).
- All material actions emit `events`.
- AI is assistive only; no autonomous decisions.

---

## 3) Phase‑1 Build Sequence (Ordered Steps)

1. **Client EEO‑Blind Data‑Access Boundary**
   - Why: This is the highest‑risk compliance boundary and a Phase‑0 critical blocker.
   - Scope: Ensure client contexts use a PII‑free access path and never select PII fields (to be implemented in Phase‑1).
   - Verification: Prove client‑context queries do not select PII fields; confirm shortlist views and feedback flows are PII‑free.
   - Evidence pointers: `docs/security-and-eeo.md` (Section 1.1.1), `docs/architecture.md` (Client Portal — EEO‑Blind Controls), `docs/phases/phase-1.md` (Client Portal requirements), `docs/checklists/phase-0-gate.md` (Section 5).

2. **Candidate Visibility Bridge via Applications**
   - Why: Visibility bridge is a Vision invariant and a Phase‑0 critical blocker.
   - Scope: Implement the applications bridge so tenant access includes applicants even when candidates are global (to be implemented in Phase‑1).
   - Verification: Demonstrate tenants can see candidates only if imported or linked via applications; no global candidate browsing exists.
   - Evidence pointers: `docs/vision.md` (Visibility Bridge), `docs/security-and-eeo.md` (Section 1.2), `docs/architecture.md` (Applications as bridge), `docs/phases/phase-1.md` (Core ATS requirements), `docs/checklists/phase-0-gate.md` (Section 4).

3. **RLS Isolation Proven In‑App**
   - Why: RLS is the primary security boundary; must be proven in actual app usage paths.
   - Scope: Verify tenant isolation through app flows that read jobs, candidates, applications, and client views (no cross‑tenant leakage).
   - Verification: Attempt cross‑tenant access paths in app flows; confirm blocked by RLS and enforcement patterns.
   - Evidence pointers: `docs/architecture.md` (RLS patterns), `docs/security-and-eeo.md` (Access Enforcement), `docs/checklists/phase-0-gate.md` (Section 3).

4. **Auth & Onboarding (Role‑Aware Routing)**
   - Why: All other flows depend on correct identity, tenant, and role resolution.
   - Scope: Implement sign‑up/invite flows and role‑aware routing using the implemented enforcement pattern (to be implemented in Phase‑1).
   - Verification: Users land on role‑appropriate dashboards and are restricted to tenant scope; no reliance on JWT claims for enforcement unless explicitly implemented.
   - Evidence pointers: `docs/phases/phase-1.md` (Authentication & Onboarding), `docs/architecture.md` (Auth model), `docs/security-and-eeo.md` (Auth & Authorization).

5. **Core ATS: Jobs, Candidates, Applications**
   - Why: Establish the core workflow with strict tenant boundaries and visibility rules.
   - Scope: Job CRUD, candidate records, application creation, and linkage (to be implemented in Phase‑1).
   - Verification: Jobs and applications are tenant‑scoped; candidates visible only via import or application linkage.
   - Evidence pointers: `docs/phases/phase-1.md` (Core ATS), `docs/architecture.md` (Data model), `docs/checklists/phase-0-gate.md` (Section 4).

6. **Pipeline Stages + Audit Events**
   - Why: Pipeline movement is a material action and must be auditable.
   - Scope: Stage transitions write `events`; client feedback and shortlist actions emit events (to be implemented in Phase‑1).
   - Verification: Confirm events exist for stage changes, client feedback, and client shortlist views.
   - Evidence pointers: `docs/security-and-eeo.md` (Audit Logging), `docs/architecture.md` (Trust & Auditability), `docs/phases/phase-1.md` (Modules).

7. **Client Feedback & Transparency Workflows**
   - Why: Pilot readiness requires client actions and candidate transparency without violating EEO‑blindness.
   - Scope: Client feedback actions update stages and write `events`; candidate status visibility uses compliant templates (to be implemented in Phase‑1).
   - Verification: Feedback actions are job‑scoped, auditable, and PII‑free; candidates receive status changes.
   - Evidence pointers: `docs/phases/phase-1.md` (Client Portal, Transparency), `docs/security-and-eeo.md` (EEO‑blind rules).

8. **AI Assistive Features (Guardrailed)**
   - Why: AI is allowed only if it does not violate privacy or autonomy constraints.
   - Scope: AI intake, match scoring, and summaries with PII‑free inputs and logging (to be implemented in Phase‑1).
   - Verification: AI calls are logged without PII; outputs avoid protected traits.
   - Evidence pointers: `docs/security-and-eeo.md` (AI Safety & Logging), `docs/architecture.md` (AI Interaction Contracts), `docs/phases/phase-1.md` (Search & Matching).

---

## 4) Definition of “Pilot‑Ready” (3–5 Agencies)

A pilot agency must be able to:

- Create a tenant, invite recruiters/clients, and authenticate into role‑specific views.
- Create jobs, attach candidates, and manage application stages end‑to‑end.
- Provide client shortlists that are **PII‑free at the data‑access layer**.
- Capture client feedback (approve/reject/request interview) with audit events.
- Provide candidate status transparency without violating EEO‑blind rules.
- Operate within strict tenant isolation; no cross‑tenant visibility is possible.

Pilot‑ready explicitly excludes billing, bulk imports, messaging/scheduling, and marketplace access.

---

## 5) Phase‑1 Verification Checklist (Short)

- [ ] Client context has **zero PII reads** (no PII fields selected in client queries).
- [ ] Applications bridge works as defined (imported or applied candidates only).
- [ ] All material actions emit `events` (shortlist views, feedback, stage changes, AI actions).
- [ ] No global candidate enumeration endpoints exist for tenant/client.
- [ ] RLS isolation is proven in‑app (not assumed).
