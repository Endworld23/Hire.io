# 🧾 Hire.io — SOC 2 Compliance Readiness Checklist

> **Version:** 1.0  
> **Pairs with:** [`docs/security-and-eeo.md`](../security-and-eeo.md) and [`docs/architecture.md`](../architecture.md)  
> **Owner:** Aaron Martin (Compliance Lead)  
> **Last Updated:** November 2025  
>  
> **Purpose:**  
> This document establishes Hire.io’s roadmap for SOC 2 Type I and II compliance.  
> It maps required Trust Service Criteria (TSC) to concrete controls, owners, and audit evidence.

---

## 🧭 1. Overview

**Objective:**  
To achieve SOC 2 Type I (design readiness) within 12 months of MVP launch, and Type II (operational maturity) within 18–24 months.

**Trust Service Criteria Covered:**
- Security  
- Availability  
- Confidentiality  
- Processing Integrity  
- Privacy  

---

## 🧩 2. Compliance Program Roles

| Role | Responsibility |
|------|----------------|
| **Founder / Compliance Lead (Aaron Martin)** | Program owner, policy approvals |
| **Technical Lead** | Infrastructure, encryption, backups |
| **DevOps Engineer** | Access control, CI/CD hardening |
| **AI Ethics Officer (TBD)** | Model prompt review & bias testing |
| **Customer Success** | Incident communications & data requests |

---

## ⚙️ 3. Core SOC 2 Control Matrix

| # | Category | Control Objective | Hire.io Control | Evidence Type |
|---|-----------|------------------|-----------------|---------------|
| **1** | Access Control | Only authorized users can access production systems. | RBAC + Supabase Auth + RLS per tenant. | Access logs, RBAC screenshots. |
| **2** | Change Management | All code changes are peer reviewed and tracked. | GitHub PR reviews, `main` branch protection. | PR history, audit log. |
| **3** | Logical Security | Source code integrity maintained. | GitHub branch rules, signed commits. | GitHub settings export. |
| **4** | Infrastructure Security | Cloud infra hardened & monitored. | Vercel + AWS CIS baseline. | Terraform plan, Axiom alerts. |
| **5** | Data Encryption | Data at rest & in transit encrypted. | AES-256, TLS 1.2+, KMS. | Config files, Supabase certs. |
| **6** | Backup & Recovery | Data can be restored within RTO/RPO. | Supabase daily backups + S3 replica. | Backup logs, restore tests. |
| **7** | Incident Response | Security events triaged within 24 h. | PagerDuty alerts → Slack. | IR reports, Slack exports. |
| **8** | Vendor Management | Third-party vendors vetted for SOC 2 alignment. | Vendor review sheet. | Vendor questionnaires. |
| **9** | Logging & Monitoring | Production events logged & reviewed. | Axiom/Datadog logs, CloudWatch. | Log samples. |
| **10** | Privacy Protection | PII minimized & deleted on request. | Deletion API + consent logs. | API responses. |
| **11** | AI Ethics & Guardrails | AI models operate without bias or PII leakage. | Prompt templates + PII redaction. | Prompt samples, audit report. |
| **12** | Physical Security | Office access restricted. | Home office policy + 2FA. | Photos, badge policy. |

---

## 🗄️ 4. Policy Documentation Set

| Policy Document | Description | Review Cycle |
|-----------------|-------------|--------------|
| **Information Security Policy** | Roles, responsibilities, risk mgmt. | Annual |
| **Access Control Policy** | User auth, 2FA, least privilege. | Semi-annual |
| **Change Management Policy** | CI/CD workflow, code reviews. | Quarterly |
| **Incident Response Plan** | Detection, escalation, postmortems. | Quarterly drill |
| **Business Continuity Plan** | Recovery time & backup testing. | Semi-annual |
| **Vendor Risk Policy** | Procurement & review requirements. | Annual |
| **AI Ethics & Bias Policy** | Responsible AI usage and auditing. | Annual |
| **Data Retention & Deletion Policy** | GDPR/CCPA compliance. | Annual |

All policies stored in `/docs/compliance/policies/`.

---

## 🧱 5. Evidence Collection Plan

| Control Area | Evidence Source | Frequency |
|---------------|----------------|------------|
| Access Control | Supabase auth logs, RBAC export | Monthly |
| Change Mgmt | GitHub PR history | Continuous |
| Incident Response | PagerDuty logs, Slack records | Per incident |
| Backups | AWS/Supabase snapshot logs | Weekly |
| Vendor Reviews | Vendor questionnaires | Annual |
| AI Bias | Fit-summary audit samples | Quarterly |

---

## 🔄 6. Risk Assessment Framework

| Severity | Likelihood | Action |
|-----------|-------------|--------|
| **Critical** | High | Immediate patch, notify founder |
| **High** | Medium | Mitigate within 7 days |
| **Medium** | Medium | Address within release cycle |
| **Low** | Low | Document & monitor |

Risk register maintained in `/docs/compliance/risk-register.md`.

---

## 🧠 7. Training & Awareness

| Training | Target Audience | Frequency |
|-----------|----------------|------------|
| Security 101 | All staff & contractors | Onboarding + annual |
| SOC 2 Overview | Engineering + Ops | Annual |
| Phishing Simulation | All employees | Quarterly |
| AI Ethics Awareness | Dev & AI team | Semi-annual |

Completion tracked in HRIS or manual spreadsheet until SOC 2 Type II stage.

---

## 🛠️ 8. Audit Preparation Milestones

| Phase | Deliverables | Target |
|--------|---------------|--------|
| **Phase 0 (MVP)** | Security & EEO framework docs complete. | ✅ Done |
| **Phase 1 (Pilot)** | Policies + logs template. | Month 3 |
| **Phase 2 (Beta)** | Begin log collection & backup tests. | Month 6 |
| **Phase 3 (Growth)** | Vendor management + incident plan tests. | Month 9 |
| **Phase 4 (Enterprise)** | SOC 2 Type I audit readiness. | Month 12 |
| **Phase 5 (Intelligence)** | SOC 2 Type II audit window (6–12 mo). | Month 24 |

---

## 🧰 9. Tooling & Vendors (Recommended)

| Category | Vendor | Status |
|-----------|---------|---------|
| Compliance Automation | **Drata / Vanta** | Evaluate |
| Secrets Mgmt | **1Password / AWS Secrets Manager** | Planned |
| Logging & SIEM | **Axiom / Datadog** | In use |
| Audit Evidence Storage | **Google Drive / Notion** | Interim |
| Ticketing & IR | **Linear / Jira / Slack Ops** | Active |

---

## 🔒 10. Encryption Configuration Standards

| Data Type | In Transit | At Rest |
|------------|------------|---------|
| Database | TLS 1.2+ | AES-256 |
| Files (S3/Supabase Storage) | HTTPS | AES-256-GCM |
| Backups | Encrypted snapshot | KMS-sealed |
| Secrets | TLS + KMS rotation | AES-256 |
| Logs | HTTPS + TLS forwarding | Encrypted S3 bucket |

Key rotation cycle: **every 90 days**.

---

## 🕒 11. Monitoring & Alerting Schedule

| Event Type | Tool | Response Target |
|-------------|------|-----------------|
| Auth anomaly | Supabase logs → PagerDuty | < 2 h |
| DB error spike | Axiom alert | < 4 h |
| Incident open | Slack #incidents | Immediate |
| AI prompt error | API monitor | < 24 h |
| Backup failure | AWS SNS → Email | < 4 h |

---

## 🧩 12. Continuous Improvement Loop

1. Collect metrics weekly (log volume, incident rate).  
2. Quarterly internal SOC 2 self-assessment.  
3. Annual external readiness review (Vanta/Drata).  
4. Update control matrix as architecture evolves.  
5. Record every remediation in `/docs/compliance/changelogs/`.

---

## 📆 13. Audit Evidence Calendar (Example)

| Month | Activity |
|--------|-----------|
| Jan | Policy review & access audit |
| Feb | Backup restore test |
| Mar | AI bias audit |
| Apr | Incident response drill |
| May | Vendor renewal check |
| Jun | SOC 2 readiness gap review |
| Jul | External penetration test |
| Aug | Phishing simulation |
| Sep | GDPR compliance check |
| Oct | Audit evidence collection |
| Nov | Type I audit window |
| Dec | Annual report summary |

---

## ✅ 14. Success Criteria

| Goal | Metric |
|------|--------|
| SOC 2 Type I Audit Passed | ≥ 90% controls operational |
| SOC 2 Type II Audit Passed | 6-12 month observation complete |
| 0 Critical Incidents | Quarterly review |
| 100% Staff Trained | Verified training completion |
| Vendor Compliance ≥ 90% | Annual reviews complete |

---

## 📘 15. References

- **AICPA SOC 2 Trust Service Criteria:**  
  [aicpa.org/soc](https://www.aicpa.org/soc)
- **Drata Guide:**  
  [drata.com/resources/soc2-guide](https://drata.com/resources/soc2-guide)
- **Vanta Checklist:**  
  [vanta.com/soc2](https://www.vanta.com/soc2)
- **NIST SP 800-53** for security controls  
- **ISO 27001** alignment reference  

---

## 🏁 Summary

Hire.io’s SOC 2 program focuses on:
- ✅ Preventing unauthorized access  
- ✅ Ensuring data integrity and availability  
- ✅ Enforcing ethical AI and privacy standards  
- ✅ Maintaining auditable evidence and transparency  

All changes affecting controls or vendors **must update this document** and reference the corresponding issue in GitHub.

---

*End of SOC 2 Compliance Readiness Checklist*
