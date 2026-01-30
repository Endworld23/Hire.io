# Phase 1 Execution Map — Hire.io

## 0) Execution Rules
- Phase‑0 constraints are non‑negotiable
- Any task that would violate a Phase‑0 gate item is invalid
- Every task must map to an acceptance criterion in `docs/phases/phase-1.md`

---

## 1) Critical Path Overview
- Minimum sequence to pilot‑ready:
  1) Client EEO‑blind data‑access boundary
  2) Candidate visibility bridge via applications
  3) RLS isolation proven in‑app
  4) Auth + tenant/role resolution
  5) Core ATS workflows (jobs, candidates, applications, pipeline)
  6) Client feedback + transparency workflows
  7) Audit events coverage
  8) Matching/pool signals (v1)
  9) Notifications (v1)
  10) Analytics (v1)
- Blocking dependencies:
  - Client EEO‑blind data‑access boundary blocks client portal and pilot readiness.
  - Candidate visibility bridge blocks any tenant/candidate workflow correctness.
  - RLS isolation proof blocks all multi‑tenant flows.
- Parallelizable (after blockers 1–3):
  - Matching/pool signals (v1) and notifications (v1) can proceed in parallel once core ATS data paths are stable.
  - Analytics (v1) can parallelize after events coverage is consistent.

---

## 2) Phase‑1 Build Order (Authoritative)

### Track 1: Auth & Tenant Resolution Hardening
**Purpose:** Establish correct identity, tenant, and role resolution for all flows.  
**Why now:** Every downstream path depends on accurate session→user→tenant resolution.  
**Hard constraints:** Use implemented enforcement pattern (`auth.uid()` + `public.users`); no reliance on JWT claims unless explicitly implemented.  
**Definition of Done:** Role‑appropriate routing works; tenant scope resolves by `auth.uid()`; unauthorized access blocked.  
**Verification Steps:** Sign in as each role and confirm access only to allowed routes and tenant data paths.  

### Track 2: Candidate Visibility Bridge (Applications)
**Purpose:** Enforce “applications are the visibility bridge” invariant.  
**Why now:** This is a Phase‑0 critical blocker and a Vision invariant.  
**Hard constraints:** No global candidate browsing; visibility only via import or application linkage.  
**Definition of Done:** Tenant users see candidates only via import or application linkage; no global enumeration endpoints exist.  
**Verification Steps:** Attempt to access candidates outside tenant scope and confirm denial; validate applicant visibility via applications.  

### Track 3: Client Portal EEO‑Blind Enforcement
**Purpose:** Guarantee client contexts never read PII.  
**Why now:** Highest‑risk compliance boundary and Phase‑0 critical blocker.  
**Hard constraints:** Client contexts must use PII‑free access paths; UI masking is insufficient.  
**Definition of Done:** Client shortlist/feedback flows do not read PII fields at any layer.  
**Verification Steps:** Inspect client‑context query paths and confirm zero PII selection; verify client views render using PII‑free data.  

### Track 4: Core ATS Workflows
**Purpose:** Enable job creation, candidate management, applications, and pipeline stages.  
**Why now:** Establishes end‑to‑end recruiter workflows under tenant isolation.  
**Hard constraints:** No cross‑tenant visibility; candidate visibility bridge enforced.  
**Definition of Done:** Recruiters can create jobs, add candidates, create applications, and move stages within tenant scope.  
**Verification Steps:** Execute job→candidate→application→stage flow within a tenant; confirm no cross‑tenant access.  

### Track 5: Audit Events Coverage
**Purpose:** Ensure all material actions emit `events`.  
**Why now:** Auditability is a core product constraint and Phase‑1 acceptance criterion.  
**Hard constraints:** Events are append‑only; missing events are compliance failures.  
**Definition of Done:** Events exist for shortlist views, feedback, stage changes, and AI actions.  
**Verification Steps:** Trigger each material action and confirm a corresponding `events` entry exists.  

### Track 6: Matching & Pool Signals (v1)
**Purpose:** Provide basic matching signals and pool gauges.  
**Why now:** Supports recruiter workflows after data correctness is proven.  
**Hard constraints:** No identity exposure in client context; AI assistive only.  
**Definition of Done:** Match scores computed for applications; pool gauge returns aggregates only.  
**Verification Steps:** Recompute matches and confirm stored scores; validate pool gauge returns counts without identities.  

### Track 7: Notifications (v1)
**Purpose:** Provide minimal operational alerts (application, feedback, interview requests).  
**Why now:** Required for pilot usability after core flows are stable.  
**Hard constraints:** No PII leaks; events logged.  
**Definition of Done:** Notifications trigger on material actions without PII leakage.  
**Verification Steps:** Trigger application/feedback events and verify notification delivery paths and logs.  

### Track 8: Analytics (v1)
**Purpose:** Basic counts/funnels/time‑to‑fill for recruiters/admins.  
**Why now:** Dependent on correct events and core data.  
**Hard constraints:** Derived from live data; no predictive analytics.  
**Definition of Done:** Dashboards display live counts/funnels aligned with underlying data.  
**Verification Steps:** Compare dashboard counts with jobs/applications/events records for the tenant.  

### Track 9: Candidate Transparency & Closure
**Purpose:** Provide candidate status visibility and compliant closure templates.  
**Why now:** Phase‑1 requires transparency without increasing risk; must follow EEO‑blind constraints.  
**Hard constraints:** No PII leaks to client contexts; closure templates are structured and auditable.  
**Definition of Done:** Candidates can see stage/status and receive compliant closure updates.  
**Verification Steps:** Trigger status changes and confirm candidate visibility and closure messaging.  

### Track 10: Job Integrity Signals
**Purpose:** Enforce job freshness and intent indicators.  
**Why now:** Reduces noise and supports trust, a Phase‑1 requirement.  
**Hard constraints:** Indicators are non‑manipulative and tenant‑scoped.  
**Definition of Done:** Jobs display freshness/intent indicators derived from real data.  
**Verification Steps:** Create/update jobs and verify freshness/intent indicators update accordingly.  

---

## 3) Track‑Level Task Breakdown

### Track 1: Auth & Tenant Resolution Hardening

**Purpose:** Correct session identity, tenant, and role resolution.  
**Constraints:** Must match implemented pattern in `docs/architecture.md`; no JWT‑claim enforcement assumptions.  
**Definition of Done:** Role‑appropriate routing works; tenant scope resolves by `auth.uid()`; unauthorized access blocked.  
**Verification Steps:** Sign in as each role and confirm access only to allowed routes and tenant data paths.  

Tasks:
- [ ] Verify session→user→tenant resolution works in protected routes
  - Files: `apps/web/app/(protected)/**`, `apps/web/lib/server-user.ts`, `apps/web/lib/supabase-server.ts`
  - Acceptance: Role‑appropriate routing; tenant scope resolves by `auth.uid()`.
  - Events: N/A
- [ ] Confirm role‑aware route gating for candidate/client/recruiter/admin
  - Files: `apps/web/app/(protected)/**`, `apps/web/lib/actions/auth.ts`
  - Acceptance: Users land on correct dashboard; unauthorized routes blocked.
  - Events: N/A

### Track 2: Candidate Visibility Bridge (Applications)

**Purpose:** Enforce applications as the visibility bridge.  
**Constraints:** No global candidate browsing; visibility only via import or application linkage.  
**Definition of Done:** Tenant users see candidates only via import or application linkage; no global enumeration endpoints exist.  
**Verification Steps:** Attempt to access candidates outside tenant scope and confirm denial; validate applicant visibility via applications.  

Tasks:
- [ ] Ensure tenant candidate lists include applicants linked via applications (to be implemented in Phase‑1)
  - Files: `apps/web/lib/actions/candidates.ts`, `apps/web/lib/actions/applications.ts`, `apps/web/app/(protected)/dashboard/**`
  - Acceptance: Recruiters see candidates only via import or application linkage.
  - Events: N/A
- [ ] Confirm no tenant/client endpoints enumerate global candidates
  - Files: `apps/web/app/**`, `apps/web/lib/actions/**`
  - Acceptance: No global candidate browsing paths; only scoped reads.
  - Events: N/A

### Track 3: Client Portal EEO‑Blind Enforcement

**Purpose:** Remove all client‑context PII reads.  
**Constraints:** Client contexts must not select PII fields; data‑access boundary enforced.  
**Definition of Done:** Client shortlist/feedback flows do not read PII fields at any layer.  
**Verification Steps:** Inspect client‑context query paths and confirm zero PII selection; verify client views render using PII‑free data.  

Tasks:
- [ ] Move client shortlist access to a PII‑free path (to be implemented in Phase‑1)
  - Files: `apps/web/app/(protected)/client/**`, `apps/web/lib/server-user.ts`
  - Acceptance: Client shortlist queries do not read PII fields.
  - Events: `client_shortlist_viewed`
- [ ] Verify client feedback updates are job‑scoped and auditable
  - Files: `apps/web/app/(protected)/client/**`, `apps/web/lib/actions/applications.ts`
  - Acceptance: Feedback updates stage; no PII reads; event recorded.
  - Events: `client_feedback_submitted`

### Track 4: Core ATS Workflows

**Purpose:** Jobs, candidates, applications, pipeline stages.  
**Constraints:** Tenant isolation; visibility bridge enforced; no PII exposure in client contexts.  
**Definition of Done:** Recruiters can create jobs, add candidates, create applications, and move stages within tenant scope.  
**Verification Steps:** Execute job→candidate→application→stage flow within a tenant; confirm no cross‑tenant access.  

Tasks:
- [ ] Job create/edit/status flows (to be implemented in Phase‑1)
  - Files: `apps/web/app/(protected)/dashboard/jobs/**`, `apps/web/lib/actions/jobs.ts`
  - Acceptance: Jobs are tenant‑scoped; status transitions tracked.
  - Events: `job_created`, `job_updated`
- [ ] Application creation + pipeline movement (to be implemented in Phase‑1)
  - Files: `apps/web/app/(protected)/dashboard/jobs/**`, `apps/web/lib/actions/applications.ts`
  - Acceptance: Applications link job↔candidate; stages update correctly.
  - Events: `application_created`, `application_stage_changed`

### Track 5: Audit Events Coverage

**Purpose:** Ensure material actions emit events.  
**Constraints:** Events append‑only; missing event is compliance failure.  
**Definition of Done:** Events exist for shortlist views, feedback, stage changes, and AI actions.  
**Verification Steps:** Trigger each material action and confirm a corresponding `events` entry exists.  

Tasks:
- [ ] Confirm events for stage changes, client feedback, shortlist views
  - Files: `apps/web/lib/actions/**`, `apps/web/app/(protected)/client/**`
  - Acceptance: Events exist for all material actions defined in Phase‑1.
  - Events: Required
- [ ] Confirm AI‑related events are logged without PII
  - Files: `apps/web/lib/actions/jobs.ts`, `apps/web/lib/actions/matching.ts`
  - Acceptance: AI calls logged without PII.
  - Events: `ai_*`

### Track 6: Matching & Pool Signals (v1)

**Purpose:** Basic recruiter‑only matching signals.  
**Constraints:** AI assistive only; no identity exposure in client contexts.  
**Definition of Done:** Match scores computed for applications; pool gauge returns aggregates only.  
**Verification Steps:** Recompute matches and confirm stored scores; validate pool gauge returns counts without identities.  

Tasks:
- [ ] Compute and store `match_score` for applications (to be implemented in Phase‑1)
  - Files: `apps/web/lib/actions/matching.ts`, `apps/web/lib/matching-engine.ts`
  - Acceptance: Match scores recorded; not exposed to clients with PII.
  - Events: `job_matches_recomputed`
- [ ] Pool gauge returns aggregate counts only (to be implemented in Phase‑1)
  - Files: `apps/web/lib/actions/matching.ts`
  - Acceptance: Aggregate only; no raw candidate lists.
  - Events: `pool_gauge_viewed`

### Track 7: Notifications (v1)

**Purpose:** Minimal notifications for pilot operations.  
**Constraints:** No PII leakage; events logged.  
**Definition of Done:** Notifications trigger on material actions without PII leakage.  
**Verification Steps:** Trigger application/feedback events and verify notification delivery paths and logs.  

Tasks:
- [ ] Notification triggers for application/feedback/interview events (to be implemented in Phase‑1)
  - Files: `apps/web/lib/actions/**`
  - Acceptance: Notifications fire on material actions; no PII in client contexts.
  - Events: `notification_sent`

### Track 8: Analytics (v1)

**Purpose:** Basic counts/funnels/time‑to‑fill.  
**Constraints:** Derived from live data; no predictive analytics.  
**Definition of Done:** Dashboards display live counts/funnels aligned with underlying data.  
**Verification Steps:** Compare dashboard counts with jobs/applications/events records for the tenant.  

Tasks:
- [ ] Dashboard counts derived from jobs/applications/events (to be implemented in Phase‑1)
  - Files: `apps/web/app/(protected)/dashboard/**`
  - Acceptance: Counts align with live data; no mock data.
  - Events: N/A

### Track 9: Candidate Transparency & Closure

**Purpose:** Status visibility and compliant closure templates.  
**Constraints:** EEO‑blind rules remain binding; closure is structured and auditable.  
**Definition of Done:** Candidates can see stage/status and receive compliant closure updates.  
**Verification Steps:** Trigger status changes and confirm candidate visibility and closure messaging.  

Tasks:
- [ ] Candidate status visibility for own applications (to be implemented in Phase‑1)
  - Files: `apps/web/app/(protected)/candidate/**`, `apps/web/lib/actions/applications.ts`
  - Acceptance: Candidate sees only their own application status.
  - Events: N/A
- [ ] Compliant closure templates applied on rejection (to be implemented in Phase‑1)
  - Files: `apps/web/app/(protected)/dashboard/**`, `apps/web/lib/actions/applications.ts`
  - Acceptance: Rejection uses compliant templates; status change logged.
  - Events: `application_stage_changed`

### Track 10: Job Integrity Signals

**Purpose:** Job freshness and intent indicators.  
**Constraints:** Indicators are derived from real job data; no artificial inflation.  
**Definition of Done:** Jobs display freshness/intent indicators derived from real data.  
**Verification Steps:** Create/update jobs and confirm freshness/intent indicators update.  

Tasks:
- [ ] Freshness indicator based on job activity timestamps (to be implemented in Phase‑1)
  - Files: `apps/web/app/(protected)/dashboard/jobs/**`, `apps/web/lib/actions/jobs.ts`
  - Acceptance: Freshness reflects actual job activity.
  - Events: `job_updated`
- [ ] Intent indicator captured from job intake fields (to be implemented in Phase‑1)
  - Files: `apps/web/app/(protected)/dashboard/jobs/**`, `apps/web/lib/actions/jobs.ts`
  - Acceptance: Intent indicator stored and visible to recruiters; no client PII exposure.
  - Events: `job_updated`


---

## 4) Verification Strategy

- **In‑app RLS proof:** Attempt cross‑tenant reads via app flows; verify denial by RLS and role gating.
- **Client PII non‑access:** Inspect client‑context queries/routes to confirm zero PII field selection.
- **Visibility bridge validation:** Verify candidate visibility only via import or application linkage; no global browsing paths exist.
- **Events completeness:** Confirm events emitted for all material actions (shortlist views, feedback, stage changes, AI actions).

---

## 5) Phase‑1 Exit Readiness

Translate exit criteria into verification steps:

- **Create tenant → invite recruiter → create job**
  - Who: Admin
  - Verify: Job exists and is tenant‑scoped; no cross‑tenant visibility.
- **Candidate signs up → applies to job → appears in pipeline**
  - Who: Candidate + Recruiter
  - Verify: Application created; candidate visible via application bridge only.
- **Client views shortlist and submits feedback**
  - Who: Client
  - Verify: Shortlist data is PII‑free; feedback updates stage and emits `events`.
- **Recruiter moves stages and sees audit trail**
  - Who: Recruiter
  - Verify: Stage changes logged in `events`.

Operational “pilot‑ready” means:
- 3–5 agencies can run full workflows end‑to‑end.
- Client flows are EEO‑blind at the data‑access layer.
- Candidate status transparency is present and auditable.
- No global candidate browsing or mass‑apply mechanics exist.

---

## 6) Explicit Non‑Tasks (Guardrails)

- No mass‑apply workflows.
- No global candidate browsing or enumeration endpoints.
- No client‑context PII reads (even server‑side).
- No reliance on JWT‑claim‑based enforcement unless explicitly implemented.
- No unlogged material actions.
- No billing, bulk imports, scheduling, messaging, or marketplace features.
