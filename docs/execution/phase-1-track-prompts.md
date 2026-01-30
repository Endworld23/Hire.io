# Phase 1 Track Execution Prompts

## How to Use This File
- Each section is a standalone execution prompt
- Copy a single prompt into Codex to execute that track
- Do not run tracks out of order
- Do not modify constraints inside prompts

---

## Global Stop Conditions (Non-Negotiable)
- If any client-context PII field selection is required (even server-side), STOP and report.
- If any schema/migration change is required, STOP and report.
- If any client flow requires bypassing RLS with service role, STOP and report.
- If any task enables global candidate enumeration, STOP and report.
- If any acceptance criterion cannot be verified, STOP and write a short note describing the gap and the smallest possible fix.

---

## Track Execution Order
1) Auth & Tenant Resolution Hardening  
2) Candidate Visibility Bridge (Applications)  
3) Client Portal EEO-Blind Enforcement  
4) Core ATS Workflows  
5) Candidate Transparency & Closure  
6) Audit Events Coverage  
7) Matching & Pool Signals (v1)  
8) Job Integrity Signals  
9) Notifications (v1)  
10) Analytics (v1)

---

## Track 1 — Auth & Tenant Resolution Hardening

### When to Run
- Phase‑0 Gate is satisfied or explicitly deferred with binding constraints (see `docs/checklists/phase-0-gate.md` and `docs/phases/phase-0.md`)
- No open PII‑read paths in client context
- No known cross‑tenant access paths in app routes

### Execution Prompt
I will harden auth and tenant/role resolution using the implemented pattern (`auth.uid()` + `public.users`) and validate role‑based routing. I will edit only `apps/web/app/(protected)/**`, `apps/web/lib/server-user.ts`, `apps/web/lib/supabase-server.ts`, and `apps/web/lib/actions/auth.ts`. If additional files are required beyond this list, STOP and report the file path(s) and justification before proceeding. I will not modify database schema, migrations, or introduce JWT‑claim enforcement. I will not loosen Phase‑0 constraints, enable PII reads in client context, or add new roles. Acceptance criteria must match `docs/phases/phase-1.md` and the requirements in `docs/execution/phase-1-execution-map.md`. Verification must confirm role‑appropriate routing and tenant scoping using `auth.uid()` lookups. If I discover a need to change enforcement patterns or add claims, I will stop and report.

### Acceptance Criteria
- Role‑appropriate routing works for admin, recruiter, client, and candidate
- Tenant scope resolves via `auth.uid()` + `public.users`
- Unauthorized routes are blocked for each role

### Verification Steps
- Sign in as each role and confirm access only to allowed routes
- Confirm tenant‑scoped reads do not cross tenants
- Inspect route guards to ensure no JWT‑claim enforcement assumptions

---

## Track 2 — Candidate Visibility Bridge (Applications)

### When to Run
- Track 1 complete and verified
- Client PII‑free access path is still enforced

### Execution Prompt
I will implement the candidate visibility bridge so tenant users can see candidates only via import or application linkage. I will edit only `apps/web/lib/actions/candidates.ts`, `apps/web/lib/actions/applications.ts`, and `apps/web/app/(protected)/dashboard/**`. If additional files are required beyond this list, STOP and report the file path(s) and justification before proceeding. I will not add global candidate browsing, and I will not create new tables or APIs. I will keep Phase‑0 constraints intact: applications are the only visibility bridge, no global enumeration endpoints, and no client‑context PII reads. Acceptance criteria must match `docs/phases/phase-1.md` and `docs/execution/phase-1-execution-map.md`. If any task requires exposing global candidates or weakening RLS, I will stop.

### Acceptance Criteria
- Recruiters can see candidates only via import or application linkage
- No tenant/client endpoints enumerate global candidates
- Candidate visibility does not leak across tenants

### Verification Steps
- Attempt to access candidates outside tenant scope and confirm denial
- Confirm applicants linked to applications are visible to the tenant
- Search for endpoints that could enumerate global candidates

---

## Track 3 — Client Portal EEO‑Blind Enforcement

### When to Run
- Track 2 complete and verified
- No client‑context PII reads exist in current routes

### Execution Prompt
I will enforce the client EEO‑blind data‑access boundary by ensuring client contexts do not read PII fields at any layer. I will edit only `apps/web/app/(protected)/client/**` and the specific existing server‑side access paths they use. If additional files are required beyond this list, STOP and report the file path(s) and justification before proceeding. I will not modify database schema or migrations. I will not select PII fields even if UI masking exists. Acceptance criteria and verification must align with `docs/security-and-eeo.md`, `docs/architecture.md`, and `docs/phases/phase-1.md`. If I find any need to read PII for client flows, I will stop and report.

### Acceptance Criteria
- Client shortlist and feedback flows do not read/select PII fields
- Client views are job‑scoped and use pseudonymous identifiers
- Client actions emit `events`

### Verification Steps
- Inspect client query paths and confirm zero PII field selection
- Load client views and verify data is anonymized
- Confirm shortlist views and feedback emit events

---

## Track 4 — Core ATS Workflows

### When to Run
- Tracks 1–3 complete and verified
- RLS isolation proven in‑app for core flows

### Execution Prompt
I will implement core ATS workflows (jobs, candidates, applications, pipeline stages) within tenant scope. I will edit only `apps/web/app/(protected)/dashboard/jobs/**`, `apps/web/app/(protected)/dashboard/candidates/**`, `apps/web/lib/actions/jobs.ts`, and `apps/web/lib/actions/applications.ts`. If additional files are required beyond this list, STOP and report the file path(s) and justification before proceeding. I will not introduce cross‑tenant reads, global browsing, or client PII reads. Acceptance criteria must align to `docs/phases/phase-1.md` and the execution map. If any workflow requires violating candidate visibility rules, I will stop.

### Acceptance Criteria
- Jobs are created/edited within tenant scope
- Applications link job↔candidate and stages can be updated
- Pipeline stage transitions work and are auditable

### Verification Steps
- Create a job and candidate under a tenant; create an application
- Move stages and verify tenant scope and visibility rules
- Confirm events are emitted for stage changes

---

## Track 5 — Candidate Transparency & Closure

### When to Run
- Track 4 complete and verified
- Candidate visibility rules enforced via applications bridge

### Execution Prompt
I will implement candidate transparency and compliant closure templates for Phase‑1. I will edit only `apps/web/app/(protected)/candidate/**`, `apps/web/app/(protected)/dashboard/**`, and `apps/web/lib/actions/applications.ts`. If additional files are required beyond this list, STOP and report the file path(s) and justification before proceeding. I will not expose any PII to client contexts, and I will not change scope beyond Phase‑1 requirements. Acceptance criteria must align with `docs/phases/phase-1.md` and the execution map. If transparency requires new data models or policies, I will stop and document the gap.

### Acceptance Criteria
- Candidates see only their own status and stage history
- Rejections use compliant closure templates
- Status changes emit `events`

### Verification Steps
- Sign in as candidate and confirm status visibility only for own applications
- Trigger a rejection and confirm closure messaging
- Verify events emitted for status changes

---

## Track 6 — Audit Events Coverage

### When to Run
- Tracks 4–5 complete and verified
- Client PII‑free boundary remains enforced

### Execution Prompt
I will ensure all material actions emit `events`. I will edit only `apps/web/lib/actions/applications.ts`, `apps/web/lib/actions/jobs.ts`, `apps/web/lib/actions/matching.ts`, `apps/web/app/(protected)/client/**`, and relevant server actions already under `apps/web/app/(protected)/**`. If additional files are required beyond this list, STOP and report the file path(s) and justification before proceeding. I will not change schema or migrations. I will not leave any material action unlogged. Acceptance criteria must align with `docs/security-and-eeo.md`, `docs/architecture.md`, and `docs/phases/phase-1.md`. If I find a material action without an event log and cannot add one without schema changes, I will stop and report.

### Acceptance Criteria
- Events exist for shortlist views, client feedback, stage changes, and AI actions
- Events are append‑only and include actor, tenant, entity, timestamp

### Verification Steps
- Trigger each material action and confirm an `events` entry
- Inspect event payloads for required fields

---

## Track 7 — Matching & Pool Signals (v1)

### When to Run
- Tracks 1–6 complete and verified
- Core ATS data paths are stable and tenant‑scoped

### Execution Prompt
I will implement matching and pool signals (v1) as assistive features. I will edit only `apps/web/lib/actions/matching.ts` and `apps/web/lib/matching-engine.ts`. If additional files are required beyond this list, STOP and report the file path(s) and justification before proceeding. I will not expose identities in client context or implement autonomous decisioning. Acceptance criteria must align with `docs/phases/phase-1.md` and the execution map. If any step requires PII exposure or changes to schema, I will stop.

### Acceptance Criteria
- `match_score` computed for applications within tenant scope
- Pool gauge returns aggregate counts only
- AI assistive only; no automated decisions

### Verification Steps
- Recompute match scores and confirm stored values
- Validate pool gauge outputs are aggregates only
- Confirm no client‑context exposure of identities

---

## Track 8 — Job Integrity Signals

### When to Run
- Track 4 complete and verified
- Job creation/edit flows stable

### Execution Prompt
I will implement job integrity signals (freshness and intent indicators) derived from real job data. I will edit only `apps/web/app/(protected)/dashboard/jobs/**` and `apps/web/lib/actions/jobs.ts`. If additional files are required beyond this list, STOP and report the file path(s) and justification before proceeding. I will not add new scope or introduce artificial indicators. Acceptance criteria must align with `docs/phases/phase-1.md` and the execution map. If integrity signals require new schema, I will stop and report.

### Acceptance Criteria
- Freshness indicators update based on job activity
- Intent indicators captured from existing job intake data

### Verification Steps
- Create/update jobs and confirm freshness/intent indicators change appropriately
- Confirm indicators are tenant‑scoped and not shown to clients with PII

---

## Track 9 — Notifications (v1)

### When to Run
- Tracks 4–6 complete and verified
- Events coverage is consistent

### Execution Prompt
I will implement minimal notifications for application and feedback events. I will edit only `apps/web/lib/actions/applications.ts`, `apps/web/lib/actions/jobs.ts`, and existing notification utilities already present in the repo. If additional files are required beyond this list, STOP and report the file path(s) and justification before proceeding. I will not expose PII to client contexts and will ensure events are logged. Acceptance criteria must align with `docs/phases/phase-1.md` and the execution map. If notifications require new providers or schema changes, I will stop.

### Acceptance Criteria
- Notifications trigger on application/feedback/interview events
- No PII is leaked in client contexts
- Notification actions are logged

### Verification Steps
- Trigger application and feedback actions and confirm notification delivery paths
- Confirm events include notification entries where required

---

## Track 10 — Analytics (v1)

### When to Run
- Tracks 4–6 complete and verified
- Core data and events are stable

### Execution Prompt
I will implement basic analytics (counts, funnels, time‑to‑fill) derived from live data. I will edit only `apps/web/app/(protected)/dashboard/**`. If additional files are required beyond this list, STOP and report the file path(s) and justification before proceeding. I will not add predictive analytics or use mock data. Acceptance criteria must align with `docs/phases/phase-1.md` and the execution map. If analytics require schema changes, I will stop and report.

### Acceptance Criteria
- Dashboard counts match underlying jobs/applications/events
- No predictive analytics or external data sources

### Verification Steps
- Compare dashboard counts to live data in tenant scope
- Confirm analytics are derived from existing records
