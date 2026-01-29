# 🔐 Hire.io — Security, Privacy & EEO Compliance Framework

> **Version:** 1.1  
> **Pairs with:** roadmap.md and architecture.md  
> **Audience:** Engineering, Compliance, and Partner Teams  
> **Purpose:** Define how Hire.io enforces data security, EEO-blind processes, and privacy-by-design across both the **Global Candidate Pool** and **tenant ATS instances**.

---

## 🧭 Overview

Hire.io’s foundational mission is **fairness, transparency, and data integrity** in hiring.

This framework covers **two layers**:

1. **Global Layer** — A single, global candidate pool owned by Hire.io  
2. **Tenant Layer** — Individual ATS instances per staffing agency/tenant  

It ensures:

- Bias-free candidate presentation (EEO-blind)
- Strong data protection (RLS, encryption, audit logging)
- Legal readiness (EEOC, OFCCP, GDPR, CCPA)
- Ethical use of AI (no PII leakage or unfair inference)
- Clear separation of **platform-only** vs **tenant-visible** data flows

> **Design principle:** Every action in Hire.io must be *auditable, reversible, and bias-neutral*.

---

## ⚖️ 1) Equal Employment Opportunity (EEO) & Anti-Bias Design

### 1.1 EEO-Blind Mode (Client Portal)

All **client-facing contexts** must be **EEO‑blind at the data access layer**. End‑employers **never** see direct identifiers.

| Category | Field | Client Portal Action |
|---------|--------|----------------------|
| Personal Identity | Name, Email, Phone, Photo, Social Links | ❌ Hidden (alias such as `Candidate A7`) |
| Demographics | Gender, Age, Ethnicity, Religion | ❌ Not stored or shown |
| Education | School Names | ⚠️ Optional anonymization |
| Experience | Employer Names | ⚠️ Optional masking |
| Resume Text | Free-form content | 🔍 Redacted via regex + AI filters |

EEO-blind mode applies to:

- Shortlists  
- Candidate cards  
- AI-generated summaries in client context  
- Public/client-accessible URLs  

**AI Enforcement:** Client‑context AI outputs must be generated from **PII‑free inputs** and must not contain PII.

### 1.1.1 EEO‑Blind Enforcement Rules (Hard Constraints)

Client‑facing contexts **MUST NOT**:
- Select PII fields (name, email, phone, raw resume text, direct identifiers).
- Access PII indirectly (joins, RPCs, server actions, or service‑role queries).
- Rely on UI masking to “hide” PII that was already read.

**Definition:** If a query reads PII for a client context, it is a **violation**, even if the UI does not render it.

---

### 1.2 Candidate ID Mapping (Global vs Tenant)

Two scopes:

#### Global Candidate Pool (platform-owned, future / Phase 2+)

- `global_candidates` is **not active in Phase 0 / Phase 1**. Any references are future‑state only.

#### Tenant Candidate Records (agency-owned)

- `candidates.id`
- `candidates.public_id` — public UUID for client portal  
- Future: linking tenant candidates ↔ global candidates  

Guarantees:

- Profiles reusable across agencies **only when explicitly linked via applications**  
- Tenants only see their own candidate rows or applicants linked via applications  
- Clients only see anonymized `public_id` + masked fields  

**Visibility rule (non‑negotiable):**  
Applications are the **only** visibility bridge across scopes. No tenant or client browsing of global candidates is ever permitted.

---

### 1.3 Bias-Free AI Guidelines

AI models must:

- **Never infer or reference protected traits**
- Base summaries strictly on skills, experience, and job-related signals
- Produce transparent, structured reasoning

System prompts always include language like:

“You are an unbiased assistant. Never infer or describe race, gender, age, religion, disability status, or other protected traits. Evaluate strictly on job-related qualifications.”

AI outputs must not:

- Recommend demographic filters  
- Imply culture-fit heuristics  
- Use bias-prone descriptors (“young”, “older”, “Western”, etc.)  

---

## AI-Assisted Hiring Compliance Requirements

When AI is used for screening, matching, or summarization, Hire.io must provide:

- **Bias audit support:** Ability to review inputs/outputs and sampling for disparate impact analysis.  
- **Notices/consent:** Clear notices when AI is involved and candidate consent where required.  
- **Opt-out/alternatives:** A non-AI path or human review option when applicable.  
- **Adverse impact monitoring:** Periodic reporting hooks tied to outcomes and stages.  
- **Record retention:** Retain decision artifacts and notices for legally required windows.  

---

## 🧱 2) Data Security Model

Postgres + RLS-centric, strict separation of platform vs tenant data.

| Layer | Mechanism | Provider |
|-------|-----------|----------|
| Auth | Supabase Auth (JWT) | Supabase |
| DB Isolation | Row-Level Security | Postgres |
| Platform vs Tenant Scope | Separate tables + policies | Postgres |
| Encryption at Rest | AES-256 | Supabase/AWS |
| Encryption in Transit | TLS 1.2+ | Vercel/Supabase |
| Secrets | Environment Secret Stores | Vercel/Supabase |
| File Storage | Signed URLs + TTLs | Supabase Storage |
| Logs | Structured JSON, PII-redacted | External Log Provider |
| Audit Events | Immutable events table | Postgres |

---

### 2.1 Platform vs Tenant Tables

**Platform-owned (future expansion / Phase 2+):**

- `global_candidates`
- Platform-level config, compliance logs

**Tenant-owned (current schema):**

- tenants  
- users  
- jobs  
- candidates  
- applications  
- stages  
- events  
- skills  
- job_application_feedback  

RLS prevents cross-tenant visibility and hides platform-only tables.

---

## 🧩 3) Authentication & Authorization

### 3.1 Auth & JWT Contents

JWT may include:

- `sub` (user_id)
- `tenant_id`
- `role`
- `email_verified`
- Optional: `is_platform_staff`

Tokens are short-lived (≈1 hour). Background jobs use the **service role** with explicit tenant checks.

**Enforcement note:** RLS enforcement must match the **implemented pattern** described in `docs/architecture.md` (currently `auth.uid()` + `public.users` lookups). JWT claims may exist, but **must not be assumed** as the enforcement mechanism unless explicitly implemented.

---

### 3.2 Roles

| Role | Scope | Description |
|------|--------|-------------|
| super_admin | Platform | Internal Hire.io staff |
| admin | Tenant | Full control of tenant data |
| recruiter | Tenant | Manages candidates, jobs, applications |
| client | Tenant | Read-only shortlist access (EEO-blind) |
| candidate | Tenant/Global | Manages own profile & applications |

**Key rule:**  
Only super_admin and server-side jobs may perform cross-tenant or global operations.

---

### 3.3 Access Enforcement

**Frontend UI**  
- Hides unauthorized navigation automatically

**API Routes**  
- Validate session/user identity and tenant/role using the implemented pattern (see `docs/architecture.md`)  
- Service role used only server-side  

**Database (RLS)**  
- Policies tied to `auth.uid()` and `public.users` (per current implementation)  
- Writes must include correct `tenant_id`  

Cross-tenant reads are impossible via the public/anon key.

---

## 🧰 4) PII Handling & Redaction Pipeline

### 4.1 Redaction Rules

Automatically removed/masked:

- Names  
- Emails  
- Phone numbers  
- Physical addresses  
- Social links  
- DOB  
- IDs  
- School/Company names (in client context)

Redaction layers:

- AI prompts  
- AI completions  
- Client-facing resume-derived text  

Recruiters may see more, but clients never do.

---

### 4.2 Storage Separation

| Data Type | Scope | Storage | Retention |
|-----------|--------|----------|-----------|
| Candidate data | Tenant | Postgres | Until deletion/contract end |
| Global identity (future) | Platform | Postgres | GDPR-compliant |
| Resume files | Mixed | Storage/S3 | ~90 days |
| Sanitized resume text | Tenant | Postgres | Matches candidate record |
| Embeddings | Mixed | Vector DB | ~30 days |
| Logs | Platform | Encrypted storage | ~180 days |

---

### 4.3 Resume Sanitization

Flow:

1. File upload → signed URL  
2. Extract text  
3. Run through sanitization pipeline  
4. Store sanitized text for:  
   - Search  
   - Ranking  
   - AI summaries  
5. Raw resume retained for:  
   - Recruiter view  
   - Compliance  

---

## 🕵️ 5) Audit Logging

### 5.1 `events` Table (simplified)

events(
id uuid,
tenant_id uuid,
actor_user_id uuid,
entity_type text,
entity_id uuid,
action text,
metadata jsonb,
created_at timestamptz
)


Examples (non‑exhaustive):

- `candidate_viewed` — includes viewer role + candidate_public_id  
- `resume_uploaded` — file metadata  
- `ai_summary_generated` — model + mode  
- `shortlist_shared` — job + client user  
- `client_shortlist_viewed` — job + client user  
- `client_feedback_submitted` — application + decision  
- `application_stage_changed` — old/new stage  

---

### 5.2 Audit Trail Access

- Tenant admins → all tenant events  
- Recruiters → events for entities they act on  
- Clients → limited to their job context  
- Super_admin → full logs via secure admin tools  

**Requirement:** All material actions **MUST** emit an `events` record.  
**Compliance rule:** Absence of an event log for a material action is a **compliance failure**.  
`events` is append-only, with logical deletes only via metadata.

---

## 🧩 6) Compliance Coverage Matrix

| Regulation | Requirement | Mechanism |
|-----------|-------------|-----------|
| EEOC/OFCCP | Blind review | EEO-blind portal, redaction |
| GDPR | Export/delete | User + admin deletion flows |
| CCPA | DN-Sell, access | No resale, access logs |
| SOC 2 | RBAC, logging | PR process, audit logs |
| HIPAA | Not applicable | No medical data stored |

---

## 🧠 7) AI Safety & Logging

### 7.1 AI Call Logging (Baseline)

Logged (current baseline):

- Model  
- Mode  
- Tokens  
- Duration  
- Cost  

PII must be removed **before** logging.

---

### 7.2 Provider Data Use (Baseline)

**Rule:** No raw prompts or responses containing PII are stored or sent to providers.  
If provider‑side “no‑training” controls are available, they must be enabled.

---

### 7.3 Bias Testing (Future / Phase 2+)

Planned (not yet active):

- ~100 AI fit summaries  
- Check for bias indicators  
- Produce compliance report  

---

## 🛡️ 8) Client Portal Security

Controls:

- Signed URLs with TTL  
- Watermarked documents  
- Access revocation  
- Limited/no-download viewer  
- Every view/scroll logged  

Shortlist links scoped to:

- Tenant  
- Job  
- Client user  

---

## 🧱 9) Backup, Recovery & Retention

| Data | Retention | Backup | Deletion |
|------|-----------|--------|----------|
| Core DB | Until contract/user deletion | Daily | Hard/soft delete |
| Global data | Until user deletion | Same | GDPR-compliant |
| Storage files | ~90 days | Weekly | Auto-purge |
| Logs | ~180 days | External | Auto-delete |
| Embeddings | ~30 days | Not required | Auto-expire |

RPO/RTO targets:

- MVP: RPO ≤ 24h, RTO ≤ 24h  
- Growth: RPO ≤ 1h, RTO ≤ 2h  

---

## ⚙️ 10) Future Enhancements (Phase 2+ / 3+)

- SOC 2 readiness & audits  
- Partner API audit hooks  
- Automated bias dashboards  
- Stronger consent logging  
- Role-based field masking  
- Anomaly detection for admin actions  

---

## ✅ 11) Compliance Review Checklist

| Category | Check | Status |
|----------|--------|--------|
| EEO Blindness | No names/emails in client views | ☐ |
| RLS Isolation | Cross-tenant tests pass | ☐ |
| Platform Separation | No tenant access to global tables | ☐ |
| Encryption | TLS + DB/file encryption verified | ☐ |
| Audit Log | All key actions recorded | ☐ |
| AI Guardrails | Prompts/completions redacted | ☐ |
| Backup Policy | Restore tests within RPO/RTO | ☐ |
| Data Deletion | End-to-end deletion flow works | ☐ |

---

## 📘 References

- EEOC: https://www.eeoc.gov  
- GDPR: https://gdpr.eu  
- OFCCP: https://www.dol.gov/agencies/ofccp  
- NIST Privacy Framework: https://www.nist.gov/privacy-framework  

---

## ✅ Summary

Hire.io ensures:

- **Bias-free hiring** through EEO-blind client views  
- **Strong tenant isolation** and encrypted storage  
- **Full auditability** for every action  
- **Ethical, transparent AI** with enforced guardrails  
- **Clear separation of global vs tenant data**  

All engineers must follow this framework.  
Any changes to data flows, AI prompts, user roles, or RLS require a **security review before merge**.

**End of Security, Privacy & EEO Compliance Framework**

---

## ✅ Security & EEO Verification Checklist (Phase 0 / Phase 1)

- [ ] Client queries do **not** select PII fields (no PII reads in client context).  
- [ ] RLS blocks cross‑tenant reads **in‑app** (verified, not assumed).  
- [ ] Applications enforce the visibility bridge (imported or applied candidates only).  
- [ ] All client actions write `events` (shortlist views, feedback).  
- [ ] All material actions write `events` (stage transitions, AI actions).  
- [ ] AI calls logged without PII; no raw prompts/responses with PII stored or sent.  
- [ ] No global candidate enumeration endpoints exist for tenant/client users.  
