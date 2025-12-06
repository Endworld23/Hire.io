# Hire.io – Phase 0 / Early Phase 1
### AI-Powered Staffing & Hiring Platform – Foundation Build

Hire.io is a next-generation **staffing agency enablement platform** that uses AI to reduce bias, streamline recruitment, and connect the right candidates with the right opportunities.

It combines:

- A **multi-tenant ATS** for staffing agencies and employers  
- A **global candidate pool** (Hire.io-managed marketplace)  
- **EEO-blind, AI-assisted matching** between jobs and candidates  

---

# Overview

Phase 0 established the foundation:

- A complete **multi-tenant database schema**
- Core **UI components**, mock flows, and demo pages  
- Documentation for **architecture, security, and SOC2 readiness**

We are now transitioning into **Phase 1**, where the real system begins:

- Supabase auth (real login, signup, tenant onboarding)
- Real candidate profiles + applications
- EEO-blind client review flows  
- AI-assisted matching + candidate pool gauge

> **Note:** Much of the AI & matching logic is still mocked. The goal is to illustrate UX and workflows while the backend becomes fully wired.

---

# Features

## Employer & Agency Features (Tenant Side)

- **Job Intake Wizard** – Multi-step job creation flow  
- **Leniency Slider** – Controls strict ↔ lenient matching logic  
- **Salary Gauge** – Visual range picker with mock market guidance  
- **Anonymized Shortlist** – Removes personal info for bias reduction  
- **Match Scoring (Mock)** – AI-style compatibility scoring  
- **Pipeline Stages** – `new → recruiter_screen → submitted_to_client → interview → offer → hired/rejected`

---

## Candidate Features (Global User Side)

- **Profile Builder** – Guided onboarding  
- **Resume Upload** – Drag-and-drop (stubbed)  
- **Skill Extraction (Mock)** – Placeholder parsing logic  
- **Experience Tracking** – Stored in structured `jsonb` fields  
- **Global Accounts** – Candidates may exist without belonging to a tenant  

---

## Admin / Internal Tools (Future)

- **Global Candidate Pool Management**  
- **Tenant Management** (agencies, subdomains, settings)  
- **Audit Log** (events, views, updates, AI usage)  
- **Structured Feedback** on applications  

---

# Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS  
- **Backend:** Supabase (PostgreSQL, Auth, Storage)  
- **Security:** PostgreSQL Row Level Security (RLS)  
- **Styling:** Tailwind CSS design system  

---

# Getting Started

## Prerequisites

- Node.js 18+  
- Supabase account  
- Environment variables stored in `.env.local`:

    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url  
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

---

## Installation

From the project root:

    npm install
    npm run dev

Open the app at:

- http://localhost:3000  
- http://localhost:3000/demo (interactive demo)

---

# Exploring the Demo (Phase 0)

The `/demo` route allows you to:

- Walk through an **example job intake**  
- Apply as a candidate (mocked)  
- View **AI-style matches**  
- Review **anonymized shortlists**  
- Browse conceptual **admin tables**  
- (Optional) seed mock data for UI testing  

This demo is **UI-only** and illustrates the vision while the backend becomes fully wired.

---

# Project Structure

    hire-io/
    ├── app/
    │   ├── page.tsx                        # Landing page
    │   └── demo/
    │       └── page.tsx                    # Interactive demo
    ├── components/
    │   ├── AdminTableView.tsx
    │   ├── AnonymizedShortlist.tsx
    │   ├── CandidateProfileBuilder.tsx
    │   ├── JobIntakeWizard.tsx
    │   ├── LeniencySlider.tsx
    │   ├── ResumeUpload.tsx
    │   └── SalaryGauge.tsx
    ├── lib/
    │   ├── supabase.ts                     # Supabase client
    │   └── auth.ts                         # Phase 1 auth helpers
    └── supabase/
        └── migrations/                     # Authoritative schema

---

# Database Schema (Consolidated)

The authoritative schema includes:

### tenants  
Multi-tenant root model for agencies/employers.

### users  
All authenticated users.

- `tenant_id = NULL` → global candidate  
- `tenant_id != NULL` → tenant member (admin, recruiter, client)

### jobs  
Tenant-owned job requisitions, including salary, skills, and spec in structured fields.

### candidates  
Candidate profiles (global or tenant-imported).

- EEO-blind `public_id` for portals  
- Skills, experience, resume metadata stored in `jsonb`  
- Optional `user_id` link  

### applications  
Links jobs ↔ candidates.

- Tracks pipeline stage  
- Stores `match_score`, score, and notes  
- Enforces uniqueness per `job_id` + `candidate_id`  

### stages  
Tenant-specific pipeline steps (ordered).

### events  
Audit log for compliance and debugging (views, updates, AI operations).

### skills  
Optional normalized skill taxonomy.

### job_application_feedback  
Structured reviewer feedback on applications.

All tables include **RLS** to enforce tenant isolation and candidate visibility rules:

- Tenants only see their own jobs, stages, events, and feedback  
- Candidates see only their own data  
- Tenants see candidates they imported or who applied to their jobs  
- Global candidate pool is visible only to internal `super_admin` roles  

---

# Phase 1 Roadmap (High-Level)

## 1. Authentication & Roles

- Supabase auth (signup, login, logout)  
- Map `auth.users` → `users` table with roles: `super_admin`, `admin`, `recruiter`, `client`, `candidate`  
- Candidate sign-up without tenant (global candidates)  
- Tenant onboarding and invitation flow for admins/recruiters  
- Protected routes and auth-aware layout  
- Password reset and email verification  

## 2. Resume Parsing & Profile Enrichment

- Integrate PDF/DOC/DOCX parsing  
- Text extraction for resume content  
- Basic NLP-based skill extraction (tech-first)  
- Extract education, experience, and contact info into `jsonb` fields  
- Store resume files in Supabase Storage with signed URLs  
- (Later) LinkedIn/profile sync for global candidates  

## 3. Matching Engine & Pool Gauge

- Design v1 matching algorithm:

  - Skill overlap (required vs possessed)  
  - Experience alignment  
  - Leniency slider → thresholds  
  - Dealbreaker handling  

- Persist `match_score` (0–100) on applications  
- Internal APIs for:

  - finding matches for a job  
  - estimating global pool size (candidate pool gauge)  

- EEO-blind shortlist output for client portal  

## 4. Core ATS Flows

- Employer/agency dashboard to manage jobs  
- Candidate application flow wired to `applications`  
- Pipeline stage transitions (drag-and-drop or action buttons)  
- Feedback capture via `job_application_feedback`  
- Basic event logging into `events`  

## 5. UX / DX Improvements

- Loading states, skeletons, and error boundaries  
- Toast notifications and validation messages  
- Mobile-responsive layouts  
- Dark mode (late Phase 1 / early Phase 2)  
- Developer ergonomics:

  - Stronger types in `lib/supabase.ts`  
  - Shared Zod schemas for API payloads  

---

# Extending the Project

## Adding a New Component

- Create the component in `components/`  
- Use TypeScript for type safety  
- Follow existing design patterns (Tailwind classes, minimal props)  
- Export and import it into the relevant page or layout  

## Adding a New Database Table

1. Create a migration in `supabase/migrations/` with a descriptive file name, e.g.:

       YYYYMMDDHHMMSS_create_<table_name>.sql

2. Include in the migration:

   - `CREATE TABLE ...`  
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`  
   - `CREATE POLICY ...` for RLS  
   - Relevant indexes  

3. Add/update TypeScript types and any Zod schemas as needed.

## Adding a New Page

- Create a folder/file under `app/`  
- Export a default React component  
- Add `'use client'` where client-side interactivity is required  
- Link it from navigation or route to it directly  

---

# Security Notes

- All database tables have **Row Level Security (RLS)** enabled  
- Tenant isolation is enforced via JWT claims (`tenant_id`, `role`, `user_id`)  
- Candidates can only see their own data  
- Recruiters/clients can only see:

  - candidates they imported, or  
  - candidates who applied to their jobs  

- Global candidate pool visibility is limited to `super_admin` (internal usage)  
- Supabase handles authentication; always validate file uploads and user inputs in production  

---

# Known Limitations (Phase 0 → Early Phase 1)

- Resume parsing uses placeholder logic  
- Matching logic is stubbed or mock-based  
- Auth may still be partially wired (not production-ready)  
- Salary and market comparison data is hardcoded  
- Limited error handling and observability  
- No production email notifications or interview scheduling yet  
- Global candidate pool search & pool gauge are not wired to the UI  

---

# Contributing

During Phase 0 / early Phase 1, please:

- Follow the roadmap priorities  
- Maintain strict TypeScript usage where possible  
- Write tests for any non-trivial logic  
- Keep `/docs` in sync with real behavior  
- Follow existing folder structure and naming patterns  

---

# License

**Proprietary – All rights reserved.**
