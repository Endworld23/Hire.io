# 🧾 Hire.io — SOC 2 Compliance Readiness Checklist

> **Version:** 1.1  
> **Pairs with:** [`docs/security-and-eeo.md`](../security-and-eeo.md) and [`docs/architecture.md`](../architecture.md)  
> **Owner:** Aaron Martin (Founder & Compliance Lead)  
> **Last Updated:** December 2025  
>
> **Purpose:**  
> This document defines Hire.io’s roadmap for **SOC 2 Type I** (design) and **Type II** (operational) compliance.  
> It maps Trust Service Criteria (TSC) to concrete controls, owners, and planned audit evidence.

---

## 🧭 1. Overview

**Objective**

- Achieve **SOC 2 Type I** design readiness within **12 months of MVP launch**.  
- Achieve **SOC 2 Type II** operational maturity within **18–24 months** after Type I.

**Trust Service Criteria Covered**

- **Security** (primary for early phases)  
- **Availability**  
- **Confidentiality**  
- **Processing Integrity**  
- **Privacy**

Security and EEO-blind design (bias-free hiring) are treated as **foundational**, not add-ons.

---

## 🧩 2. Compliance Program Roles

| Role | Responsibility |
|------|----------------|
| **Founder / Compliance Lead (Aaron Martin)** | Overall SOC 2 program owner, policy approvals, risk acceptance. |
| **Technical Lead** | System architecture, encryption, backups, environment configuration. |
| **DevOps / Platform Engineer (TBD/Future)** | CI/CD, access control enforcement, observability setup. |
| **AI Ethics & Safety Lead (TBD/Future)** | AI prompt guardrails, bias testing, PII redaction rules. |
| **Customer Success / Support** | Incident communications, data subject requests, client security questionnaires. |

> Until a larger team exists, multiple roles may be performed by the same person but must still be tracked distinctly in documentation.

---

## ⚙️ 3. Core SOC 2 Control Matrix (Draft)

This matrix will be refined as architecture moves from MVP → Growth (see `architecture.md`).

| # | Category | Control Objective | Hire.io Control (Current / Planned) | Evidence Type |
|---|----------|-------------------|--------------------------------------|---------------|
| **1** | Access Control | Only authorized users access production data & systems. | Supabase Auth (JWT), RLS by `tenant_id`, app-level RBAC (`super_admin`, `admin`, `recruiter`, `client`, `candidate`). | Supabase auth logs, RLS policies, role mapping docs. |
| **2** | Change Management | All code changes are reviewed, tested, and traceable. | GitHub PRs, protected `main` branch, CI checks for lint/build/tests (planned). | PR history, branch protection screenshot, CI logs. |
| **3** | Logical Security | Source code integrity and repo access are protected. | GitHub org with 2FA required, least-privilege access, optional signed commits (future). | GitHub security settings export, access review logs. |
| **4** | Infrastructure Security | Hosting environments are hardened and monitored. | Vercel + Supabase managed infra; future AWS baseline for Growth (security groups, restricted access). | Vercel/Supabase config, security review notes. |
| **5** | Data Encryption | Data at rest and in transit is encrypted. | TLS 1.2+ for all network traffic, Supabase-managed encryption at rest, encryption for storage buckets. | Supabase/Vercel docs, config screenshots, SSL test results. |
| **6** | Backup & Recovery | Data can be restored within defined RTO/RPO. | Supabase automated backups; planned restore testing schedule; future cross-region or S3 backup for Growth. | Backup logs, documented restore test results, DR playbook. |
| **7** | Incident Response | Security/availability incidents are detected, triaged, and documented. | Incident runbook, Slack `#incidents` channel, PagerDuty/alerting (planned). | IR reports, postmortems, alert history. |
| **8** | Vendor Management | Third-party vendors meet minimum security standards. | Vendor inventory with SOC 2/ISO status, DPAs, and security questionnaires. | Vendor list, signed DPAs, completed questionnaires. |
| **9** | Logging & Monitoring | Key security and system events are logged and reviewed. | Supabase & Vercel logs; planned centralization via Axiom/Datadog in Growth phase. | Log samples, alert config, review meeting notes. |
| **10** | Privacy & Data Rights | PII is minimized, protected, and deletable/exportable. | Data retention & deletion policies, deletion API (planned), consent tracking in DB. | Policy docs, sample deletion/export logs. |
| **11** | AI Ethics & Guardrails | AI does not leak PII or introduce bias. | Prompt templates with PII redaction, EEO-blind mode for client views, quarterly bias tests (planned). | Prompt library, redaction rules, bias audit reports. |
| **12** | Physical Security | Workstations and home office access are protected. | Enforced full-disk encryption, strong OS login, MFA, secure home network guidelines. | Photos/config evidence, device inventory, self-attestations. |

---

## 🗄️ 4. Policy Documentation Set

All policies live under: `docs/compliance/policies/`.

| Policy Document | Description | Review Cycle |
|-----------------|-------------|--------------|
| **Information Security Policy** | Roles, responsibilities, risk management, and security principles. | Annual |
| **Access Control Policy** | User provisioning/deprovisioning, 2FA, least privilege, log review. | Semi-annual |
| **Change Management Policy** | Git workflow, reviews, CI/CD requirements. | Quarterly |
| **Incident Response Plan** | Detection, escalation, communication, postmortems. | Quarterly drill |
| **Business Continuity & DR Plan** | RTO/RPO targets, backup and restore testing. | Semi-annual |
| **Vendor Risk Management Policy** | Vendor evaluation, review, and termination standards. | Annual |
| **AI Ethics & Bias Policy** | Guardrails for AI prompts, outputs, and bias monitoring. | Annual |
| **Data Protection & Privacy Policy** | GDPR/CCPA-style rights, retention, and deletion. | Annual |

> Phase 0/1: These policies may start as concise markdown docs and grow in depth as the platform scales.

---

## 🧱 5. Evidence Collection Plan

Plan how you’ll prove controls actually operate.

| Control Area | Evidence Source | Frequency |
|--------------|----------------|----------|
| Access Control | Supabase auth logs, GitHub collaborator list, role mapping exports. | Monthly review |
| Change Management | GitHub PR history, branch protection rules, CI build logs. | Continuous + monthly sampling |
| Incident Response | Incident tickets, Slack threads, postmortem docs. | Per incident |
| Backups & DR | Supabase backup logs, documented restore tests. | Backups: weekly check; restores: quarterly test |
| Vendor Reviews | Vendor list, security questionnaires, legal/DPAs. | Annual |
| AI Bias & Guardrails | Sampled fit summaries, redaction tests, bias review notes. | Quarterly |
| Privacy & Data Rights | Deletion/export logs, user requests and responses. | As requested + quarterly sample |

---

## 🔄 6. Risk Assessment Framework

Hire.io maintains a **lightweight risk register** tracking threats, likelihood, and mitigations.

| Severity | Likelihood | Default Action |
|----------|-----------|----------------|
| **Critical** | High | Immediate mitigation, founder notified, incident opened. |
| **High** | Medium | Mitigate within 7 days, track in issue tracker. |
| **Medium** | Medium/Low | Address within next release cycle. |
| **Low** | Low | Document, monitor, and revisit quarterly. |

- Risk register file: `docs/compliance/risk-register.md`.  
- Updated at least **quarterly** or after any major incident.

---

## 🧠 7. Training & Awareness

Even with a small team, **training is mandatory**.

| Training | Target Audience | Frequency |
|----------|-----------------|-----------|
| Security & Privacy 101 | All staff/contractors | Onboarding + annual refresh |
| SOC 2 Overview | Engineering + Ops | Annual |
| Phishing & Social Engineering Awareness | All staff | Quarterly |
| AI Ethics & EEO-Blind Practices | Dev, AI, Product, and Support | Semi-annual |
| Incident Response Drill | Engineering + Support | Annual (minimum) |

Training can be tracked via simple spreadsheets or HRIS until a formal LMS is adopted.

---

## 🛠️ 8. Audit Preparation Milestones

SOC 2 alignment should track the **product roadmap phases** (see `roadmap.md`).

| Phase | Product Milestone | SOC 2 Milestone | Target |
|------|-------------------|-----------------|--------|
| **Phase 0 — Foundations** | Schema + docs + basic infra | Security/EEO framework & this checklist drafted. | ✅ Done |
| **Phase 1 — MVP (Pilot)** | 3–5 agencies onboarded | Baseline policies published; logging & access review process defined. | ~Month 3 |
| **Phase 2 — Beta** | 10–20 agencies | Centralized logging + backup/restore testing in place. | ~Month 6 |
| **Phase 3 — Growth** | Billing + automation | Vendor management formalized; IR drills; risk register active. | ~Month 9 |
| **Phase 4 — Enterprise** | SSO, API, white-label | SOC 2 Type I readiness (design + evidence snapshot). | ~Month 12 |
| **Phase 5+** | Intelligence & ecosystem | SOC 2 Type II audit covering 6–12 month window. | ~Month 24 |

---

## 🧰 9. Tooling & Vendors (Planned / Recommended)

| Category | Vendor/Option | Status |
|----------|---------------|--------|
| Compliance Automation | Drata / Vanta | Evaluate before Type I audit. |
| Secrets Management | 1Password / AWS Secrets Manager / Supabase Secrets | Phase 1–2 adoption. |
| Logging & Monitoring | Supabase + Vercel initially; Axiom/Datadog for Growth. | Planned |
| Evidence Repository | Google Drive / Notion / GitHub repo `/docs/compliance/evidence/`. | Interim |
| Ticketing & Incidents | Linear / GitHub Issues + Slack. | Active/Planned |
| Uptime & Synthetic Monitoring | UptimeRobot / BetterStack. | Future (Phase 2–3) |

---

## 🔒 10. Encryption & Key Management Standards

| Data Type | In Transit | At Rest | Notes |
|----------|-----------|---------|-------|
| Database (Postgres) | TLS 1.2+ | Provider-managed AES-256 | Supabase defaults; verify config. |
| Storage (Resumes & Files) | HTTPS | Encrypted storage/buckets | Signed URLs with TTL. |
| Backups | Encrypted transport | Encrypted snapshots | Retention per DR policy. |
| Secrets | TLS to secret store | Encrypted via provider KMS | Rotation at least every 90 days. |
| Logs | HTTPS ingestion | Encrypted storage | Redact PII where feasible. |

Key rotation target: **every 90 days** or upon suspected compromise.

---

## 🕒 11. Monitoring & Alerting Schedule

| Event Type | Source/Tool | Response Target |
|------------|-------------|-----------------|
| Auth anomalies (failed logins, spikes) | Supabase logs → alerting (email/Slack) | < 2 hours |
| DB errors / elevated latency | Supabase/Vercel monitoring | < 4 hours |
| Application 5xx spikes | Vercel logs & metrics | < 4 hours |
| Backup failures | Supabase backup status / future SNS | < 4 hours |
| Security incident identified | Slack `#incidents` + runbook | Immediate triage |
| AI redaction failures | AI error logs / manual QA | < 24 hours |

Initial implementation may be simple email notifications, then upgraded to PagerDuty or similar as the team grows.

---

## 🔁 12. Continuous Improvement Loop

1. **Weekly:** Review key metrics (errors, incidents, uptime, backup status).  
2. **Monthly:** Mini security review (access control, logs spot-check).  
3. **Quarterly:**  
   - SOC 2 self-check against this checklist.  
   - AI bias and EEO-blindness evaluation on sampled output.  
   - Update risk register and mitigation plans.  
4. **Annually:**  
   - External readiness review (e.g., with Drata/Vanta/consultant).  
   - Policy update cycle and training refresh.  
5. **On Change:**  
   - Any material change to architecture, data flows, or role model triggers an update of `architecture.md`, `security-and-eeo.md`, and this checklist.

All changes should be logged in `docs/compliance/changelogs/`.

---

## 📆 13. Audit Evidence Calendar (Example)

| Month | Activity |
|-------|----------|
| Jan | Policy review + access audit (Supabase + GitHub). |
| Feb | Backup restore test (staging env). |
| Mar | AI bias & EEO-blindness audit sample. |
| Apr | Incident response tabletop drill. |
| May | Vendor/security questionnaire renewal. |
| Jun | SOC 2 gap analysis and remediation plan. |
| Jul | External penetration test / security assessment. |
| Aug | Phishing simulation + security training refresh. |
| Sep | GDPR/CCPA-style privacy/DSAR process check. |
| Oct | Evidence tidy-up and documentation audit. |
| Nov | Type I audit readiness or Type II window. |
| Dec | Annual security & compliance summary. |

---

## ✅ 14. Success Criteria

| Goal | Metric / Definition |
|------|---------------------|
| **SOC 2 Type I readiness** | All required controls documented and at least partially evidenced. |
| **SOC 2 Type II readiness** | Controls operated for 6–12 months with evidence. |
| **Zero unhandled critical incidents** | All Critical/High incidents have mitigation + postmortem. |
| **Training coverage 100%** | All staff completed annual security & privacy training. |
| **Vendor compliance ≥ 90%** | Majority of critical vendors have SOC 2/ISO or equivalent due diligence. |
| **No systemic AI bias issues** | Quarterly audits show no repeat violations of EEO or bias rules. |

---

## 📘 15. References

- AICPA SOC 2 Trust Service Criteria  
- NIST SP 800-53 (Security and Privacy Controls)  
- ISO/IEC 27001 and 27002 (Information Security Management)  
- `docs/security-and-eeo.md` — Hire.io’s security, privacy & EEO framework  
- `docs/architecture.md` — System design & data flow  
- `docs/roadmap.md` — Phase plan for product and platform maturity  

---

## 🏁 Summary

Hire.io’s SOC 2 program is designed to grow **with** the product:

- Start lean with Supabase + Vercel + strong RLS and EEO-blind patterns.  
- Layer on logging, automation, and vendor reviews as agencies and traffic scale.  
- Treat AI ethics and bias reduction as **first-class control objectives**, not afterthoughts.  

Any change that affects **data access, AI behavior, hosting, or vendors** must:

1. Update this checklist.  
2. Link to a tracked issue in GitHub.  
3. Be reviewed for security and compliance impact before deployment.

---

*End of SOC 2 Compliance Readiness Checklist*
