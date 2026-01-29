# Phase-0 Drift Audit — Hire.io

1) Executive Summary
- Overall status: FAIL
- Top 5 drift risks (one-liners)
  - Phase-0 gate checklist is empty, so Phase-0 acceptance claims are unverifiable. (`docs/checklists/phase-0-gate.md`)
  - Client shortlist route selects candidate PII fields (full_name) despite EEO-blind requirements. (`apps/web/app/(protected)/client/jobs/[jobId]/shortlist/shortlist-data.ts`)
  - Global candidate pool bridging via applications is blocked in code (only tenant-owned candidates allowed). (`apps/web/lib/actions/applications.ts`)
  - Docs claim JWT-claim-based RLS, but current policies key off `auth.uid()` + `public.users` lookups. (`supabase/migrations/20251223101500_applications_rls_refresh.sql`)
  - Docs reference a single consolidated schema file name, but repo has multiple conflicting consolidated migrations with different definitions. (`supabase/migrations/20251114000000_consolidate_schema.sql`, `supabase/migrations/20251206030000_consolidate_schema.sql`)
- Recommended order of remediation
  - Fix client portal PII access paths (code) and align EEO-blind contract.
  - Reconcile consolidated schema source-of-truth and update docs to the true authoritative migration.
  - Unblock application bridge for global candidates (or update docs to state it is not implemented).
  - Align RLS/JWT assumptions in docs with actual policies.
  - Populate Phase-0 gate checklist (or remove Phase-0 “complete” claims).

2) Phase-0 Gate Checklist Results
- Section: (none; file is empty)
  - Status: FAIL
  - Evidence: `docs/checklists/phase-0-gate.md` is 0 bytes (no sections to evaluate).
  - Drift: Docs reference a Phase-0 gate checklist but provide no criteria, making Phase-0 “done” claims unverifiable.
  - Fix: DOC FIX — add checklist sections + criteria, or remove Phase-0 completion claims from `docs/phases/phase-0.md` and `docs/roadmap.md`.

3) Findings by Category (deep dive)

A) Documentation authority & hierarchy
- Status: PARTIAL
- Evidence:
  - `docs/README.md`:
    ```
    ### Tier 1 — Vision & Non-Negotiables (Overrides All)
    * **`vision.md`**
    ```
  - `docs/roadmap.md`:
    ```
    This document is the single source of truth for all Hire.io planning, design, development, and feature work.
    ```
- Drift: `docs/README.md` defines the vision as top authority, while `docs/roadmap.md` claims “single source of truth.” This is a doc hierarchy conflict.
- Fix: DOC FIX — clarify in `docs/roadmap.md` that it is authoritative for sequencing only, and subordinate to `docs/vision.md` / `docs/architecture.md`.

B) Database schema reality
- Status: PARTIAL
- Evidence:
  - `docs/roadmap.md`:
    ```
    **Authoritative DB Source:** `supabase/migrations/<timestamp>_consolidated_schema.sql`
    ```
  - `supabase/migrations/20251206030000_consolidate_schema.sql`:
    ```
    # Hire.io - Consolidated Multi-Tenant + Global Candidate Schema (Authoritative)
    ```
  - `supabase/migrations/20251114000000_consolidate_schema.sql`:
    ```
    # Consolidated multi-tenant schema (authoritative)
    ```
- Drift: Docs demand a single `*_consolidated_schema.sql`, but the repo has multiple “authoritative” consolidated schema files with conflicting definitions (e.g., user role list and tenant_id nullability). This undermines schema source-of-truth.
- Fix: DOC FIX — name and bless a single authoritative migration; note the deprecation of older consolidated files.

C) RLS / policies reality
- Status: PARTIAL
- Evidence:
  - `docs/architecture.md`:
    ```
    using (tenant_id::text = (auth.jwt() ->> 'tenant_id'))
    ```
  - `supabase/migrations/20251223101500_applications_rls_refresh.sql`:
    ```
    tenant_id = (select tenant_id from public.users where id = auth.uid())
    ```
- Drift: Docs assume JWT-claim-based RLS. Current RLS policies use `auth.uid()` and lookups in `public.users` instead.
- Fix: DOC FIX — update `docs/architecture.md` and `docs/security-and-eeo.md` to reflect UID-based RLS patterns, or change policies to JWT-claims if that is intended.

D) Candidate visibility bridge (critical)
- Status: FAIL
- Evidence:
  - `docs/vision.md`:
    ```
    Candidates are visible to a tenant only when one of the following is true:
    * The tenant imported the candidate
    * The candidate is linked to a tenant job via an application
    ```
  - `apps/web/lib/actions/applications.ts`:
    ```
    if (!candidate || candidate.owner_tenant_id !== tenantId) {
      return { success: false as const, error: 'Candidate not found in your tenant' }
    }
    ```
  - `apps/web/lib/actions/candidates.ts`:
    ```
    .from('candidates')
    .select('id, full_name, email, phone, owner_tenant_id, created_at')
    .eq('owner_tenant_id', tenantId)
    ```
- Drift: Code only allows applications for tenant-owned candidates and only lists tenant-owned candidates. This blocks global candidates from being linked via applications, contradicting the “applications as visibility bridge” requirement.
- Fix: CODE FIX — allow applications for global candidates (owner_tenant_id NULL) and update list views to include applicants via the applications bridge. If out of scope, DOC FIX to state global candidate linkage is not implemented yet.

E) Client portal EEO-blindness (critical)
- Status: FAIL
- Evidence:
  - `docs/security-and-eeo.md`:
    ```
    | Personal Identity | Name, Email, Phone, Photo, Social Links | ❌ Hidden (alias such as `Candidate A7`) |
    ```
  - `apps/web/app/(protected)/client/jobs/[jobId]/shortlist/shortlist-data.ts`:
    ```
    candidate:candidates(
      id,
      public_id,
      full_name,
      skills,
      experience
    )
    ```
- Drift: The client shortlist route queries `full_name` (PII) and uses raw `experience` without redaction. This violates the EEO-blind requirement to avoid PII access in client views.
- Fix: CODE FIX — use the `client_job_shortlist` RPC (PII-free) or restrict selections to `public_id` + sanitized fields; add redaction/sanitization pipeline before any client exposure.

F) Events/auditability reality
- Status: PARTIAL
- Evidence:
  - `supabase/migrations/20251206030000_consolidate_schema.sql`:
    ```
    CREATE TABLE events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    ```
  - `apps/web/app/(protected)/client/jobs/[jobId]/shortlist/shortlist-data.ts`:
    ```
    action: 'client_viewed_shortlist',
    ```
- Drift: Events exist and are used for key actions, but audit logging is inconsistent across client flows (e.g., `/client` uses `client_job_shortlist` without an event insert, while `/client/jobs/[jobId]/shortlist` logs views). This partially meets “all material actions logged.”
- Fix: CODE FIX — standardize event logging for all client shortlist access paths; DOC FIX to note any intentional exceptions.

G) Auth/JWT role claims reality
- Status: PARTIAL
- Evidence:
  - `docs/architecture.md`:
    ```
    Auth model: Supabase Auth; JWT session; claims include `user_id`, `tenant_id`, `role`
    ```
  - `apps/web/lib/server-user.ts`:
    ```
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!
    ...
    .from('users')
    .select('*')
    ```
- Drift: Role/tenant resolution is done via `public.users` and service-role reads, not JWT claims. Docs imply JWT claims are the primary enforcement mechanism.
- Fix: DOC FIX — document the actual role resolution mechanism and cookie token flow; or CODE FIX to add JWT custom claims if that is the intended model.

H) AI guardrails/logging reality (foundation only)
- Status: PARTIAL
- Evidence:
  - `apps/web/lib/actions/jobs.ts`:
    ```
    function stripPII(text: string): string {
      let cleaned = text
      cleaned = cleaned.replace(/.../, '[EMAIL]')
    }
    ```
  - `apps/web/lib/actions/jobs.ts`:
    ```
    await supabase.from('events').insert({
      action: 'ai_job_intake_qna',
      metadata: { model: 'gpt-4', tokens_used: data.usage?.total_tokens }
    })
    ```
- Drift: PII stripping exists for intake, and AI events are logged, but there is no explicit “no-training” flag or prompt/response retention strategy documented/implemented, and no central AI logging schema.
- Fix: DOC FIX — explicitly state current AI logging/guardrail baseline; CODE FIX — add provider “no-training” controls and structured logging if required.

I) Repo structure/tooling/env vars
- Status: FAIL
- Evidence:
  - `docs/roadmap.md` (Phase 0 repo structure):
    ```
    - /app
    - /components
    - /lib
    ```
  - `README.md` (project structure):
    ```
    ├── app/
    ├── components/
    ├── lib/
    ```
  - `package.json`:
    ```
    "workspaces": [
      "apps/*",
      "packages/*"
    ]
    ```
  - `apps/web/lib/supabase.ts`:
    ```
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    ```
- Drift: Docs describe a single-app structure (`/app`, `/components`, `/lib`), but the repo is a monorepo (`apps/*`, `packages/*`). Env var names in docs (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) do not match actual usage (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`).
- Fix: DOC FIX — update `docs/roadmap.md`, `docs/phases/phase-0.md`, and root `README.md` to reflect `apps/web` + `packages/*` and correct env var names.

4) “Non-Drift” Violations (Hard Stops)
- Client access to PII — CRITICAL
  - Evidence: `apps/web/app/(protected)/client/jobs/[jobId]/shortlist/shortlist-data.ts`
    ```
    candidate:candidates(
      id,
      public_id,
      full_name,
      skills,
      experience
    )
    ```
- Global candidate browsing — UNKNOWN
  - Evidence missing: No direct UI/API routes inspected that list global candidates without tenant scoping. Confirm by auditing any admin/super_admin routes and server-side RPCs.
- Mass-apply mechanics — UNKNOWN
  - Evidence missing: No mass-apply flows found in inspected files. Confirm by searching for bulk-apply endpoints or job application batch operations.
- Missing RLS on PII tables — UNKNOWN
  - Evidence missing: RLS is enabled in consolidated migration, but confirm in live DB. Audit Supabase dashboard or `supabase db diff` output.
- Unlogged material decisions — UNKNOWN
  - Evidence missing: Events are logged for several actions; confirm other decision paths (job status changes, candidate exports, AI summaries) are logged consistently.

5) Delta Recommendations (Docs-first)
- Prioritized doc updates needed (exact files + sections)
  1. `docs/checklists/phase-0-gate.md` — add Phase-0 checklist sections and criteria (or remove references to the gate).
  2. `docs/roadmap.md` — update “Authoritative DB Source” filename and remove “single source of truth” wording; add monorepo structure (`apps/web`, `packages/*`).
  3. `docs/architecture.md` + `docs/security-and-eeo.md` — update RLS/JWT claim assumptions to match auth.uid + `public.users` policy logic.
  4. `docs/security-and-eeo.md` — remove references to `global_candidates` table or specify it as future-only not in schema.
  5. `README.md` (root) — update structure and env var names to match actual usage.

- Prioritized code/schema fixes needed (exact files/migrations)
  1. `apps/web/app/(protected)/client/jobs/[jobId]/shortlist/shortlist-data.ts` — remove PII fields (`full_name`) and use RPC `client_job_shortlist` or sanitized view.
  2. `apps/web/lib/actions/applications.ts` + `apps/web/lib/actions/candidates.ts` — allow applications for global candidates and list candidates via applications bridge (or explicitly disable in docs).
  3. `supabase/migrations/*consolidate_schema*.sql` — declare a single authoritative consolidated migration and deprecate the other one (or merge into a new canonical migration).

- Docs to delete/merge to remove contradictions
  - Merge or deprecate older consolidated schema references in `docs/roadmap.md` once the canonical migration is chosen.
  - Remove redundant legacy structure descriptions in `README.md` once monorepo structure is documented in `docs/roadmap.md`.

6) Appendix
- File inventory inspected (paths)
  - `docs/vision.md`
  - `docs/checklists/phase-0-gate.md`
  - `docs/roadmap.md`
  - `docs/architecture.md`
  - `docs/security-and-eeo.md`
  - `docs/phases/phase-0.md`
  - `docs/README.md`
  - `README.md`
  - `package.json`
  - `supabase/migrations/20251114000000_consolidate_schema.sql`
  - `supabase/migrations/20251206030000_consolidate_schema.sql`
  - `supabase/migrations/20251223101500_applications_rls_refresh.sql`
  - `supabase/migrations/20251224120000_candidates_applicant_visibility.sql`
  - `supabase/migrations/20251224123000_candidates_applicant_visibility_polish.sql`
  - `supabase/migrations/20251224130000_client_portal_shortlist.sql`
  - `supabase/migrations/20251224133000_client_feedback_select.sql`
  - `supabase/migrations/20251218090000_jobs_rls_policy_refresh.sql`
  - `apps/web/lib/supabase.ts`
  - `apps/web/lib/supabase-server.ts`
  - `apps/web/lib/server-user.ts`
  - `apps/web/lib/actions/candidates.ts`
  - `apps/web/lib/actions/applications.ts`
  - `apps/web/lib/actions/matching.ts`
  - `apps/web/lib/actions/jobs.ts`
  - `apps/web/lib/actions/auth.ts`
  - `apps/web/app/(protected)/client/page.tsx`
  - `apps/web/app/(protected)/client/jobs/[jobId]/shortlist/shortlist-data.ts`
  - `apps/web/app/(protected)/client/jobs/[jobId]/shortlist/actions.ts`
  - `apps/web/app/(protected)/client/jobs/[jobId]/shortlist/page.tsx`
  - `apps/web/app/(protected)/dashboard/page.tsx`
  - `apps/web/app/(protected)/candidate/page.tsx`

- Open questions where evidence is missing
  - Are there any super_admin-only routes or RPCs that expose global candidates? (Search `apps/web` and `apps/*` for `super_admin`-specific endpoints.)
  - Are AI prompt/response logs stored outside `events` (e.g., external log provider)? (Check logging config/runbooks.)
  - Are RLS policies in the live Supabase project consistent with these migrations? (Run `supabase db diff` or inspect Supabase dashboard.)

> **Addendum (Jan 2026):** `docs/checklists/phase-0-gate.md` has been populated since this audit draft.  
> Re-run/refresh this audit to evaluate each checklist section against repo reality.

---

## Phase-0 Resolution & Deferral Status

### CRITICAL Findings

| Finding | Phase-0 Status | Justification | Enforcement Location |
|---|---|---|---|
| Client portal PII access path (EEO-blind violation) | Deferred | Not resolved in code; Phase‑1 is **blocked** until client context uses PII‑free access paths. Deferral does **not** permit PII reads in client contexts. | `docs/phases/phase-1.md` → “Phase‑0 Gate (Blocking)”, “Phase 1 Modules & Acceptance Criteria (Client Portal)”, “Phase 1 Readiness Checklist (Execution)”; `docs/security-and-eeo.md` → “1.1.1 EEO‑Blind Enforcement Rules”; `docs/architecture.md` → “Client Portal — EEO‑Blind Controls” |
| Candidate visibility bridge not implemented (applications as bridge) | Deferred | Not resolved in code; Phase‑1 requires the applications bridge to function as defined. Deferral does **not** allow global candidate browsing. | `docs/phases/phase-1.md` → “Phase‑0 Gate (Blocking)”, “Core ATS (Per Tenant)”, “Phase 1 Readiness Checklist (Execution)”; `docs/security-and-eeo.md` → “1.2 Candidate ID Mapping (Global vs Tenant)”; `docs/architecture.md` → “Applications as the visibility bridge” |

### HIGH Findings

| Finding | Phase-0 Status | Justification | Enforcement Location |
|---|---|---|---|
| Schema authority ambiguity (multiple “consolidated” migrations) | Resolved (Docs) | Documentation now requires a single canonical consolidated migration and records the ambiguity as a Phase‑0 deviation; gate evidence must name the canonical file. | `docs/architecture.md` → “Phase‑0 note” (authoritative migration requirement) |
| RLS/JWT mismatch (docs vs implementation) | Resolved (Docs) | Architecture and Security docs now reflect `auth.uid()` + `public.users` enforcement; JWT claims are not assumed for RLS. | `docs/architecture.md` → “Row‑Level Security (RLS) — Patterns”; `docs/security-and-eeo.md` → “Authentication & Authorization” |
