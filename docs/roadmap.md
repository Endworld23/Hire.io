# 🚀 Hire.io – Master Product, Feature & Architecture Reference

> **Version:** 1.0  
> **Owner:** Aaron Martin  
> **Last Updated:** November 2025  
>  
> This document is the **single source of truth** for all Hire.io planning, design, development, and feature work.  
> Every file, phase, and product decision within this folder should align to the structure and priorities outlined here.

---

## 🧭 Vision

**Hire.io** is a next-generation **Staffing Agency Enablement Platform** — a transparent, AI-driven, and compliance-ready system for modern staffing firms.

> **“Shopify for staffing agencies — built for fairness, transparency, and speed.”**

Hire.io helps agencies:
- Operate a modern, bias-free **ATS**  
- Offer clients transparent candidate feedback portals  
- Empower recruiters with **AI-assisted workflows**  
- Maintain **data ownership** and **EEO compliance**  
- Build efficiency and consistency across placements  

---

## 💡 Core Principles

| Principle | Description |
|------------|-------------|
| **EEO-Blind Compliance** | Anonymized candidate profiles ensure bias-free client views. |
| **AI Assistance** | Job intake Q&A, Fit Summaries, predictive search, and smart matching. |
| **Transparency** | Clients and candidates can both see relevant activity and engagement. |
| **Data Security** | No export options, watermarked resume viewing, strict audit logs. |
| **Affordability** | SaaS pricing that scales from startups to large firms. |
| **Scalability** | Modular build-out that scales through defined roadmap phases. |

---

## 🧩 System Overview

### Core Product Modules
1. **ATS Core**
   - Job requisitions, candidate uploads, pipelines.
2. **Client Portal**
   - EEO-blind candidate review, approvals, analytics.
3. **Search & Matching Engine**
   - Leniency slider, candidate pool gauge, semantic AI search.
4. **AI Layer**
   - Job spec calibration, fit summaries, anonymization helpers.
5. **Analytics & Reports**
   - Time-to-fill, recruiter productivity, source tracking.
6. **Integrations & Communication**
   - Email, calendar sync, SMS, job boards.

---

## 🪜 Product Roadmap Phases

| Phase | Name | Goal | Duration | Status |
|--------|------|------|-----------|--------|
| 0 | **Foundations** | Set up infra, schema, design system | 2–3 weeks | Planned |
| 1 | **MVP (Pilot)** | Core ATS + EEO-blind portal for 3–5 agencies | 10–12 weeks | Planned |
| 2 | **Beta** | Operational SaaS (10–20 agencies) | +3–4 months | Pending |
| 3 | **Growth** | Monetization, billing, automation | +6 months | Future |
| 4 | **Enterprise** | SSO, API, white-label version | +12–18 months | Future |
| 5 | **AI Intelligence** | Predictive matching & analytics | +24 months | Future |
| 6 | **Ecosystem** | Marketplace, verified credentials, community | Year 3+ | Future |

---

## ⚙️ Phase 0 – Foundations

**Goal:** Establish full project infrastructure and documentation.

### Deliverables
- **Tech Setup**
  - Next.js (App Router) + Tailwind + shadcn/ui
  - Supabase (Postgres + Auth + Storage)
  - Environment management (Vercel + Supabase)
  - ESLint + TypeScript strict mode
- **Repo Structure**
  - /apps, /packages, /docs (monorepo format)
- **Docs Created**
  - architecture.md – system design
  - security-and-eeo.md – compliance & bias prevention
  - roadmap.md – this document
- **Database Schema**
- Tenant → User → Job → Candidate → Application → Stage → Event → Skill
---

## 🚀 Phase 1 – MVP (Pilot-Ready)

**Goal:** Deliver a functional platform to 3–5 staffing agencies.

### Modules

#### 1. Authentication & Onboarding
- Supabase Auth with multi-tenant RBAC
- Agency creation + user invites
- Role separation: Admin / Recruiter / Client / Candidate

#### 2. Core ATS
- Job requisition builder (with AI intake Q&A)
- Candidate upload + parsing (PDF/DOC)
- Pipeline management (drag-and-drop)
- Activity & audit log

#### 3. Client Portal (EEO-Blind)
- Client dashboard per job
- Candidate cards (mask PII)
- Feedback actions: approve / reject / request interview
- Controlled, watermark viewer (no exports)

#### 4. Search & Matching
- Keyword + skill-based search
- **Leniency Slider** → adjusts strictness
- **Pool Gauge** → visual estimate of candidate supply
- Fit summaries via OpenAI API

#### 5. Notifications
- Automated emails (new candidate, interview request, status updates)
- SendGrid or Resend integration

#### 6. Analytics
- Active jobs per recruiter
- Candidate funnel overview
- Time-to-fill metric

💰 **Infra Cost:** ~$25–$50/month  
🏁 **Milestone:** Pilot-ready MVP

---

## ⚙️ Phase 2 – Beta (Production-Ready)

**Goal:** Transition to real agency use and improve daily operations.

### Key Enhancements
- Bulk candidate upload, tagging, and filtering
- Notes & @mentions per candidate
- Interview scheduling (Google/Microsoft integration)
- Client messaging threads
- Branded client subdomains (agency.hire.io)
- Meilisearch for full-text & fuzzy search
- Alerts for new matches or updates
- Recruiter KPIs & performance analytics

💰 **Infra Cost:** ~$150–$300/month  
🏁 **Milestone:** 10–20 paying agencies, feedback cycle initiated

---

## 💳 Phase 3 – Growth Platform

**Goal:** Scale Hire.io into a full SaaS platform with billing and automation.

### Features
- Stripe billing (multi-plan, per-seat pricing)
- Advanced team management & permissions
- Multi-brand / division support
- Workflow automation (if/then triggers)
- “Hire.io Verified” badge integration
- Advanced reporting (ClickHouse analytics)
- Data retention and audit logs

💰 **Infra Cost:** ~$500–$1,000/month  
🏁 **Milestone:** 100+ agencies, solid recurring revenue

---

## 🏢 Phase 4 – Enterprise & API Ecosystem

**Goal:** Make Hire.io extensible and enterprise-ready.

### Features
- Public REST + GraphQL APIs
- API key management & usage tracking
- Webhooks for all major events
- SSO (Okta, Azure AD, Google)
- SCIM provisioning for user management
- Multi-agency talent sharing network
- White-label platform for large firms
- Full SOC2 compliance and audit tools

🏁 **Milestone:** 500+ agencies, enterprise contracts live

---

## 🤖 Phase 5 – AI Intelligence & Predictive Layer

**Goal:** Add AI-driven insights and predictive features.

### Features
- Predictive analytics (time-to-fill, success likelihood)
- Recruiter performance models
- Market trends & heatmaps
- Explainable AI recommendations (“why this candidate”)
- Adaptive matching (learns from successful placements)
- Auto-sourcing AI agents & outreach assistants

💰 **Infra Cost:** ~$3K–$5K/month  
🏁 **Milestone:** AI-driven recommendation system online

---

## 🌐 Phase 6 – Ecosystem & Marketplace

**Goal:** Build a connected ecosystem that monetizes partnerships.

### Features
- Partner marketplace (background checks, verifications)
- API licensing (“Hire.io Verified” credential graph)
- Recruiter community & template hub
- Affiliate & revenue share integrations
- Platform-level analytics monetization

🏁 **Milestone:** $5M+ ARR potential, full ecosystem maturity

---

## 🧠 Technical Stack Evolution

| Stage | Frontend | Backend | Data | AI | Hosting |
|--------|-----------|----------|------|------|----------|
| MVP | Next.js + Tailwind | Supabase API | Postgres | OpenAI | Vercel / Supabase |
| Beta | Next.js + Supabase + Meilisearch | Next.js API Routes | Postgres + Meilisearch | OpenAI | Vercel / Supabase |
| Growth | Next.js + NestJS | Redis + Stripe | Meilisearch + ClickHouse | OpenAI | AWS |
| Enterprise | Next.js + Microservices | Kafka + EKS | OpenSearch + ClickHouse | LangChain | AWS / GCP |
| AI Layer | Hybrid front + backend agents | GraphQL Gateway | Vector DB | Custom LLMs | GPU Cloud |

---

## 🧱 Architecture Overview

### Frontend
- **Framework:** Next.js (App Router)
- **Styling:** TailwindCSS + shadcn/ui
- **State Mgmt:** React Query + Context
- **AI Calls:** OpenAI REST endpoints (supplied via env variables)
- **Deployment:** Vercel (preview + production)

### Backend
- **MVP:** Supabase (Postgres + Edge Functions)
- **Growth:** Move to NestJS + Prisma
- **Later:** Dedicated microservices (Jobs, Candidates, AI, Billing)

### Database
- **Supabase (Postgres):**  
- Row-level security for tenants  
- pgvector for embeddings (AI search)  
- **ClickHouse:** analytics pipeline (future)

### AI Integrations
- **OpenAI:** text generation, fit summaries  
- **LangChain:** orchestration for later intelligence phase  
- **Meilisearch/OpenSearch:** semantic matching  

---

## 🔐 Security & Compliance Framework

- Row-Level Security per tenant (Postgres RLS)
- Encrypted storage for resumes & sensitive data
- JWT-based user sessions
- AI-based redaction of PII for anonymization
- Full audit log for all actions
- GDPR/EEO/OFCCP compliance-ready
- SOC2 documentation templates in /docs/compliance/

---

## 💼 Business Model

### Primary Revenue
- SaaS subscriptions (per agency / per seat)
- AI usage credits
- SMS & skill verification add-ons
- API licensing (Hire.io Verified)
- Marketplace revenue share

### Growth Strategy
1. Pilot 3–5 agencies for testimonials.  
2. Expand via staffing associations & partnerships.  
3. Introduce billing & marketplace.  
4. Scale via enterprise contracts.

---

## 🗂️ Recommended Folder Structure
hire-io/
├── apps/
│   ├── web/                   # Next.js frontend
│   └── api/                   # Backend services (future)
├── packages/
│   ├── ui/                    # Shared components
│   ├── schemas/               # Zod & TypeScript schemas
│   └── utils/                 # Helpers & common logic
├── public/
│   └── assets/                # Brand visuals, icons
├── docs/
│   ├── roadmap.md             # ← This document
│   ├── architecture.md        # System diagrams, data flow
│   ├── security-and-eeo.md    # Bias prevention, compliance logic
│   └── compliance/            # SOC2/GDPR materials
└── README.md                  # Short intro for repo viewers

---

## 🧭 Usage & Governance Rules

- This document defines **the entire Hire.io scope**.
- New features must be mapped to an existing phase.
- Feature proposals outside the current phase require approval.
- When a phase is complete:
  - Mark all submodules ✅  
  - Archive supporting docs to /docs/history/
- Each commit message should reference the phase and feature, e.g.:

feat(phase1-core): added candidate upload and pipeline drag
fix(phase2-beta): search indexing bug in Meilisearch

---

## 🧩 Quick Reference: Phase-by-Phase Summary

| Phase | Core Deliverables | Output |
|--------|-------------------|---------|
| 0 | Infra, DB, Design System | Repo + Supabase Project |
| 1 | Core ATS + Client Portal | MVP Pilot |
| 2 | Search + Messaging + Analytics | Beta Launch |
| 3 | Billing + Automation + Verified | SaaS Platform |
| 4 | SSO + API + Compliance | Enterprise Version |
| 5 | Predictive AI + Market Insights | Intelligence Layer |
| 6 | Marketplace + Community | Ecosystem Growth |

---

## ✅ Final Note

> **Hire.io’s mission** is to bring transparency, fairness, and intelligence to staffing.  
> Every technical, design, and business decision should reinforce:
> 1. Data Security  
> 2. Candidate Fairness  
> 3. Recruiter Efficiency  
> 4. Agency Profitability  

This document is your **master roadmap**.  
Keep it updated, keep it aligned, and use it to prevent scope creep as Hire.io grows.

---

*End of Master Product, Feature & Architecture Reference*