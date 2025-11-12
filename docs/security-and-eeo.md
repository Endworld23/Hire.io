# 🔐 Hire.io — Security, Privacy & EEO Compliance Framework

> **Version:** 1.0  
> **Pairs with:** [`docs/roadmap.md`](./roadmap.md) and [`docs/architecture.md`](./architecture.md)  
> **Audience:** Engineering, Compliance, and Partner Teams  
> **Purpose:** Define how Hire.io enforces data security, EEO-blind processes, and privacy-by-design.

---

## 🧭 Overview

Hire.io’s foundational mission is **fairness, transparency, and data integrity** in hiring.  
This framework ensures:
- Bias-free candidate presentation (EEO-blind)
- Strong data protection (RLS, encryption, audit logging)
- Legal readiness (EEOC, OFCCP, GDPR, CCPA)
- Ethical use of AI (no PII leakage or unfair inference)

> **Design principle:** Every action in Hire.io must be *auditable, reversible, and bias-neutral*.

---

## ⚖️ 1) Equal Employment Opportunity (EEO) & Anti-Bias Design

### 1.1 EEO-Blind Mode
All client-facing views strip or mask candidate personally identifiable information (PII):

| Category | Field | Action |
|-----------|--------|--------|
| **Personal Identity** | Name, Email, Phone, Photo, Social Links | ❌ Hidden or replaced with alias |
| **Demographics** | Gender, Age, Ethnicity | ❌ Not stored or exposed |
| **Education** | School Names | ⚠️ Optionally anonymized (e.g. “Tier 1 University”) |
| **Experience** | Employer Names | ⚠️ Can be masked (“Major Insurance Firm”) |
| **Resume Data** | Text content | 🔍 Redacted for identifiers using regex + AI filters |

> **AI Enforcement:** Before rendering any AI output, all PII tokens are stripped from prompts and completions.

---

### 1.2 Candidate ID Mapping
Internally, each candidate is assigned:
- `public_id` → UUID visible in client portal  
- `internal_id` → DB primary key  
This prevents clients from cross-referencing external systems.

---

### 1.3 Bias-Free AI Guidelines
Hire.io’s AI models (OpenAI / LangChain) are configured to:
- **Never** infer or reference demographic traits.
- Weight skills, experience, and context only.
- Output structured reasoning (“fit narrative”) with neutral tone.

Each AI prompt includes:

```text
System: You are an unbiased assistant producing fair and lawful hiring summaries.
Do not infer or describe race, gender, or other protected traits.
```

---

## 🧱 2) Data Security Model

| Layer | Mechanism | Provider |
|--------|------------|-----------|
| **Auth** | Supabase Auth (JWT, tenant claims) | Supabase |
| **DB Isolation** | Row-Level Security (RLS) per tenant | Postgres |
| **Encryption at Rest** | AES-256 | Supabase / AWS |
| **Encryption in Transit** | TLS 1.2+ | Vercel/Supabase |
| **Secrets Mgmt** | Vercel & Supabase Secrets | Managed |
| **File Storage** | Signed URLs + TTLs | Supabase / S3 |
| **Logs** | Structured JSON, redact PII | Vercel / Axiom |
| **Audit Events** | Immutable append-only `events` table | Postgres |

---

## 🧩 3) Authentication & Authorization

### 3.1 Auth
- JWT includes: `user_id`, `tenant_id`, `role`, `email_verified`
- Tokens short-lived (1h) with refresh tokens managed by Supabase

### 3.2 Roles
| Role | Description | Permissions |
|------|--------------|--------------|
| **Admin** | Agency owner | Full CRUD + billing |
| **Recruiter** | Staff member | CRUD jobs, candidates, pipelines |
| **Client** | Employer partner | Read-only shortlist access |
| **Candidate** | Job seeker | View/modify own data only |

### 3.3 Access Enforcement
- Frontend hides unauthorized UI sections.
- API enforces authorization based on role claims.
- RLS ensures database-level tenant isolation.

---

## 🧰 4) PII Handling & Redaction Pipeline

### 4.1 Redaction Rules
Regex & AI filters automatically remove or mask:
```
Name, Email, Phone, Address, Social URLs, Dates of Birth, School/Company Names
```

### 4.2 Storage Separation
| Data Type | Storage | Retention |
|------------|----------|------------|
| Candidate core data | Supabase Postgres | Permanent (until deletion) |
| Resume files | Supabase Storage / S3 | 90 days |
| AI embeddings | pgvector | 30 days |
| Logs | Encrypted (Axiom/S3) | 180 days |

### 4.3 Resume Sanitization
- Resume text is processed through AI filter → sanitized copy.
- Sanitized text stored for search & AI matching.
- Raw resume retained in encrypted blob for audit access only.

---

## 🕵️ 5) Audit Logging

### 5.1 Events Table
```
events(id, tenant_id, actor_user_id, entity_type, entity_id, action, metadata, created_at)
```

| Example Action | Metadata |
|----------------|-----------|
| “candidate_viewed” | `{ "viewer_role": "client", "candidate_public_id": "abc123" }` |
| “resume_uploaded” | `{ "file": "resume.pdf", "hash": "..." }` |
| “ai_summary_generated” | `{ "model": "gpt-4-turbo", "prompt_id": "fit_v1" }` |

### 5.2 Audit Trail Access
- Agency admins can view all tenant-level events.
- Clients can view only their own job-related events.
- System maintains immutable append-only records.

---

## 🧩 6) Compliance Coverage Matrix

| Regulation | Requirement | Hire.io Mechanism |
|-------------|-------------|-------------------|
| **EEOC / OFCCP** | Blind candidate review, no demographic data | EEO-blind mode, AI redaction |
| **GDPR** | Data export/deletion, consent | Self-service deletion API, consent logs |
| **CCPA** | “Do Not Sell” equivalent | No third-party resell of data |
| **SOC2 (Planned)** | Change management, access control | GitHub + RBAC + event audit |
| **HIPAA (N/A)** | Medical data (not collected) | – |

---

## 🧠 7) AI Safety & Logging

### 7.1 Prompt Logging
Each AI call stores:
- `model`, `prompt_template_id`, `token_count`, `duration_ms`, `cost_estimate`
- All logs redact any user-provided PII.

### 7.2 Prompt Storage
Prompts and completions are **never** reused for model training.  
OpenAI requests are sent with:
```
"data_policy": "no-training"
```

### 7.3 Bias Testing
Quarterly check:
- Random sample of 100 AI fit summaries
- Evaluated for implicit bias keywords
- Logged as compliance report

---

## 🛡️ 8) Client Portal Security

| Control | Description |
|----------|-------------|
| **URL Protection** | Signed URLs with 24h TTL |
| **Watermarks** | `tenant_name • client_name • timestamp` overlay |
| **Access Revocation** | Admins can revoke access at any time |
| **No Download** | PDF viewer blocks right-click/download |
| **View Events** | Logged on open/scroll/page events |

---

## 🧱 9) Backup, Recovery & Retention

| Data | Retention | Backup | Deletion Policy |
|------|------------|---------|------------------|
| Core DB | Continuous | Daily (Supabase/AWS RDS) | User deletion API |
| Storage (Resumes) | 90 days | Weekly snapshot | Auto-purge after expiry |
| Logs | 180 days | Axiom/S3 | Auto-delete after 6 months |
| AI Embeddings | 30 days | none | Auto-expire |

---

## ⚙️ 10) Future Enhancements (Phase 3+)

- ✅ SOC2 audit preparation (vendor: Drata / Vanta)
- ✅ API audit hooks for partners
- ✅ Automated bias reporting dashboard
- ✅ Consent record encryption (RSA-2048)
- ✅ Role-based masking (custom visibility by job/client)

---

## ✅ 11) Compliance Review Checklist

| Category | Check | Status |
|-----------|--------|--------|
| EEO Blindness | Candidate PII fully masked in client views | ☐ |
| RLS Isolation | Cross-tenant access test passed | ☐ |
| Encryption | TLS + AES-256 verified | ☐ |
| Audit Log | Events logged for key user actions | ☐ |
| AI Guardrails | Prompt redaction verified | ☐ |
| Backup Policy | Retention tested | ☐ |

> This checklist should be run at the end of every release cycle before deployment to production.

---

## 📘 References
- **EEOC Guidelines:** https://www.eeoc.gov/
- **GDPR Overview:** https://gdpr.eu/
- **OFCCP Resources:** https://www.dol.gov/agencies/ofccp
- **NIST Privacy Framework:** https://www.nist.gov/privacy-framework

---

## ✅ Summary

Hire.io’s compliance posture ensures:
1. **Bias-free candidate evaluation**
2. **Strong tenant isolation and encryption**
3. **Full auditability and consent tracking**
4. **Ethical, transparent AI usage**

All developers and contributors must follow this framework.  
Changes to data access, AI prompts, or user roles require a **security review** before merge.

---

*End of Security, Privacy & EEO Compliance Framework*
