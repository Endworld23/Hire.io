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

All **client-facing views** strip or mask PII. End-employers **never** see direct identifiers.

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

**AI Enforcement:** All PII tokens are stripped from prompts and completions before rendering in client context.

---

### 1.2 Candidate ID Mapping (Global vs Tenant)

Two scopes:

#### Global Candidate Pool (platform-owned)

- `global_candidates.id`
- `global_candidates.public_id` — PII-free public UUID

#### Tenant Candidate Records (agency-owned)

- `candidates.id`
- `candidates.public_id` — public UUID for client portal  
- Future: linking tenant candidates ↔ global candidates  

Guarantees:

- Profiles reusable across agencies  
- Tenants only see their own candidate rows  
- Clients only see anonymized `public_id` + masked fields  

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

**Platform-owned (future expansion):**

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

JWT includes:

- `sub` (user_id)
- `tenant_id`
- `role`
- `email_verified`
- Optional: `is_platform_staff`

Tokens are short-lived (≈1 hour). Background jobs use the **service role** with explicit tenant checks.

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
- Validate JWT claims  
- Service role used only server-side  

**Database (RLS)**  
- Policies tied to `tenant_id` + `role`  
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


Examples:

- `candidate_viewed` — includes viewer role + candidate_public_id  
- `resume_uploaded` — file metadata  
- `ai_summary_generated` — model + mode  
- `shortlist_shared` — job + client user  

---

### 5.2 Audit Trail Access

- Tenant admins → all tenant events  
- Recruiters → events for entities they act on  
- Clients → limited to their job context  
- Super_admin → full logs via secure admin tools  

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

### 7.1 AI Call Logging

Logged:

- Model  
- Prompt template ID  
- Mode  
- Tokens  
- Duration  
- Cost  

PII removed before logging.

---

### 7.2 Provider Data Use

All prompts sent with **no-training** flags.

---

### 7.3 Bias Testing

Quarterly review:

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
