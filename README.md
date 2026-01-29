# Hire.io

> **Product Type:** B2B‑first, multi‑tenant ATS for staffing agencies
> **Status:** Phase‑0 defined, NOT passed; Phase‑1 execution BLOCKED by Phase‑0 Gate

Hire.io is a **B2B‑first, multi‑tenant ATS** designed to invert traditional hiring (employer discovery → candidate). Trust, auditability, and EEO‑blindness are hard constraints. Hire.io is **not** a job board and **not** a mass‑apply platform.

---

## Documentation Authority (System of Record)

1. **Tier‑1 / Non‑Negotiable:** `docs/vision.md`
2. **Phase‑0 Gate (Blocks Execution):** `docs/checklists/phase-0-gate.md`
3. **Drift Audit (Reality Check):** `docs/audits/phase-0-drift-audit.md`
4. **Sequencing Only:** `docs/roadmap.md`
5. **Execution Contracts:** `docs/phases/phase-*.md`
6. **System Constraints:** `docs/architecture.md`, `docs/security-and-eeo.md`

If any implementation conflicts with Vision, Gate, or Security/EEO docs, it is invalid.

---

## 📚 What to Read First

1. `docs/vision.md` — Why Hire.io exists and what it must never become
2. `docs/checklists/phase-0-gate.md` — Non‑negotiable constraints that block execution
3. `docs/audits/phase-0-drift-audit.md` — Current reality vs intent
4. `docs/architecture.md` — System boundaries and enforcement model
5. `docs/security-and-eeo.md` — EEO‑blind, privacy, and audit rules
6. `docs/roadmap.md` — Sequencing and scope only
7. `docs/phases/phase-1.md` — Execution contract (blocked until gate passes)

---

## Current Project Status (Truthful)

- **Phase‑0:** DEFINED but **NOT PASSED**.
- **Phase‑1:** **BLOCKED** until the Phase‑0 Gate passes.

References:
- `docs/checklists/phase-0-gate.md`
- `docs/audits/phase-0-drift-audit.md`

---

## Repository Structure (Monorepo)

```
hire-io/
├── apps/
│   └── web/                 # Next.js app
├── packages/                # Shared packages (schemas, ui, utils)
├── supabase/
│   └── migrations/          # Database schema + RLS migrations
├── docs/                    # Canonical documentation
└── README.md
```

---

## Security & Compliance (Hard Constraints)

- **EEO‑blind client views are enforced at the data‑access layer** (no PII reads in client context).
- **RLS is the primary security boundary** for tenant isolation.
- **All material actions are auditable** via `events`.

See `docs/security-and-eeo.md` and `docs/architecture.md`.

---

## Getting Started (Development)

### Prerequisites

- Node.js 18+
- Supabase project

Create a `.env.local` with the variables used in this repo:

```
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
NEXT_PUBLIC_APP_URL=...
```

Install and run:

```
npm install
npm run dev
```

---

## Contributing / Expectations

- Docs are part of the system of record.
- Any code change that violates **Vision**, **Phase‑0 Gate**, or **Security/EEO** docs is invalid.
- Phase‑1 work **must not weaken Phase‑0 constraints**.

See: `docs/vision.md`, `docs/checklists/phase-0-gate.md`, `docs/security-and-eeo.md`.
