# 🚀 Hire.io — Phase 0: Foundations & Architecture Setup

> **Version:** 1.1  
> **Owner:** Aaron Martin  
> **Pairs with:** `architecture.md`, `roadmap.md`, `security-and-eeo.md`  
> **Purpose:** Define the exact deliverables, decisions, and system setup accomplished in **Phase 0**.  
> **Outcome:** A stable foundation for Phase 1 (MVP).

---

# 📌 Phase 0 Summary

Phase 0 establishes all **infrastructure, schema, security posture, and documentation** needed before building the real Hire.io MVP.  
It ensures the repo and system are aligned to:

- Multi-tenant architecture  
- Global candidate pool vision  
- EEO-blind compliance  
- Secure RLS patterns  
- AI-assisted hiring workflows  
- Clear Phase 1 roadmap  

Phase 0 is **not about building features** — it is about building the platform that will support them.

---

# 📚 1) Documentation Created & Updated

### Completed in Phase 0:

- ✔ **`roadmap.md`** — Master product & feature reference  
- ✔ **`architecture.md`** — Full system architecture (MVP → Growth)  
- ✔ **`security-and-eeo.md`** — EEO-blind and security compliance framework  
- ✔ **`phase-0.md`** — (This file) finalized  
- ✔ Established standard commit structure: `feat(phaseX-feature): ...`  
- ✔ Defined global vs tenant data boundaries  

Documentation now serves as the **source of truth** for all future development.

---

# 🏗️ 2) Project Structure & Tooling

### Folder Structure Initialized

hire-io/
├─ app/ # Next.js application
├─ components/ # UI components
├─ lib/ # Supabase client, helpers
├─ public/ # Assets, logos
├─ supabase/ # Migrations, types, config
└─ docs/ # Architecture, roadmap, security, phases


### Tools & Frameworks Installed

- ✔ **Next.js 16**
- ✔ **React 19**
- ✔ **Tailwind CSS**
- ✔ **TypeScript (strict)**
- ✔ **Supabase CLI**
- ✔ **Vercel for deployment**
- ✔ **GitHub repo structure**
- ✔ **AI-assisted coding workflow (Codex / Auto-Context)**

---

# 🗄️ 3) Database Schema — Consolidated & Finalized

Phase 0 delivered the **authoritative Phase 1-ready schema**, including:

### Core Tables (Tenant Scope)

- `tenants` — agency organizations  
- `users` — multi-tenant users with role (`super_admin`, `admin`, `recruiter`, `client`, `candidate`)  
- `jobs` — job requisitions  
- `candidates` — agency-owned candidate records  
- `applications` — candidate→job pipelines  
- `stages` — per-tenant pipeline definitions  
- `events` — audit log  
- `skills` — skill taxonomy  
- `job_application_feedback` — structured feedback

### Global Platform Tables (Future-Proofed)

- `global_candidates` (placeholder for future Phase 3+ expansion)  
- Global/tenant linking patterns defined conceptually  

### Security Layer

- **Row-Level Security (RLS)** fully enabled  
- Policies enforce:  
  - tenant isolation  
  - role-based writes  
  - EEO-blind client visibility  
  - safe candidate editing  
- JWT metadata standardized:  
  - `tenant_id`, `role`, `user_id`, `email_verified`

### Indexing & Performance

- GIN indexes for JSONB fields (skills/spec)  
- B-tree indexes on foreign keys and common query columns  

---

# 🔐 4) Authentication & Role Framework

### Role Model Finalized:

| Role | Scope | Description |
|------|--------|-------------|
| **super_admin** | Platform | Platform staff; can manage tenants and global operations |
| **admin** | Tenant | Agency owner; full CRUD within tenant |
| **recruiter** | Tenant | Operates ATS; manages jobs/candidates |
| **client** | Tenant | End-employer; EEO-blind shortlist access |
| **candidate** | Tenant/Global | Job seeker; owns their own data |

### Auth Flow (Planned in Phase 1)

- Supabase Auth (email/password + social login)
- JWTs include tenant & role metadata
- Service role key reserved for backend jobs only

---

# ⚖️ 5) EEO-Blind Design Finalized

Client-facing views must:

- hide PII  
- use alias IDs (`public_id`)  
- redact resume text  
- apply AI-based PII filtering  
- watermark documents  
- log all views in `events`

The compliance pattern is now locked in for Phase 1.

---

# 🧠 6) AI Strategy — Foundation Laid

Phase 0 defines:

### AI Pipelines

- **Job Intake Calibration**  
- **Fit Narratives**  
- **Candidate→Job Matching**  
- **Sanitization Pipeline**  
- **Leniency Slider logic concept**  

### Guardrails

- Explicit anti-bias instructions  
- No demographic inference  
- Sanitized prompts for client-facing use  
- Logging structure for all AI actions  

AI infrastructure will be built in **Phase 1 and Phase 2**.

---

# 💅 7) UI/UX Foundations

Core components scaffolded (mock / placeholder):

- Job Intake Wizard  
- Candidate Profile Builder  
- Resume Upload  
- Leniency Slider  
- Salary Gauge  
- Shortlist Viewer  
- Admin Table Views  

These are **UI shells**, not fully functional — placeholders for Phase 1 flows.

---

# 🌐 8) DevOps, CI/CD, and Environment Setup

### Completed:

- Local dev launch flow (`npm run dev`)
- Vercel deployment pipeline  
- `.env.local` example added  
- Supabase project initial setup  
- Migration workflow established  
- GitHub branching/commit rules established  
- Security/EEO review required for any schema change  

### Phase 1 work will add:

- CI checks  
- Sentry  
- Test environment  
- Real auth middleware  

---

# 📌 9) What Phase 0 Does **Not** Include

To avoid scope creep, Phase 0 intentionally excludes:

- Real authentication  
- Resume parsing  
- Live matching engine  
- Client portal logic  
- Agency onboarding wizard  
- File upload permissions  
- Email/SMS notifications  
- Billing  
- Analytics dashboards  
- Domain setup  

All of these are Phase 1–3 responsibilities.

---

# 🧩 10) Acceptance Criteria — Phase 0 (Completed)

| Requirement | Status |
|------------|--------|
| Consolidated schema created & validated | ✔ |
| Multi-tenant RLS patterns established | ✔ |
| Final role system defined | ✔ |
| Documentation updated (roadmap, architecture, EEO/security) | ✔ |
| Repo structure established | ✔ |
| Supabase migrations prepared | ✔ |
| Codex workflow established for Phase 1 work | ✔ |

---

# 🎯 11) Next Steps — Phase 1 (MVP Pilot)

Phase 1 will deliver the **working ATS** for 3–5 pilot agencies:

- Real Supabase Auth  
- Global candidate onboarding  
- Recruiter dashboard  
- Client EEO-blind portal  
- AI-assisted job intake & matching  
- Resume parsing  
- Pipeline stages & drag-and-drop  
- Email/notification basics  

See `docs/roadmap.md` and `architecture.md` for full breakdown.

---

# ✅ Conclusion

Phase 0 provides:

- A complete architecture  
- A secure, scalable database  
- A clear compliance framework  
- A clean codebase ready for real features  
- A unified roadmap and ground truth for all future work  

Hire.io is now ready to begin **Phase 1 (MVP)** and build the first real version of the platform.

---

*End of Phase 0 Foundations Document*
