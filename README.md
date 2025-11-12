# Hire.io - Phase 0

> AI-Powered Hiring Platform - Foundation Build

Hire.io is a next-generation hiring platform that leverages AI to reduce bias, streamline recruitment, and connect the right candidates with the right opportunities.

## Overview

Phase 0 establishes the foundation with a complete database schema, core UI components, and an interactive demo showcasing the end-to-end hiring flow. All features use mock data and placeholder AI logic to demonstrate the intended user experience.

## Features

### For Employers
- **Job Intake Wizard**: Multi-step form to create detailed job postings with requirements
- **Leniency Slider**: Configure hiring flexibility (strict to lenient matching)
- **Salary Gauge**: Visual salary range picker with market comparison (mock data)
- **Anonymized Shortlist**: Review candidates without personal information to reduce bias
- **Match Scoring**: AI-generated compatibility scores for each candidate

### For Candidates
- **Profile Builder**: Step-by-step profile creation wizard
- **Resume Upload**: Drag-and-drop resume upload with automatic parsing
- **Skill Extraction**: Automatic extraction of skills and experience from resumes (mock)
- **Experience Tracking**: Years of experience and skill proficiency

### Admin Tools
- **Table Views**: View all database entities (employers, candidates, jobs, matches, feedback)
- **Data Management**: Browse and inspect all system data

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Styling**: Tailwind CSS with custom design system

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (database is pre-configured)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   The `.env.local` file is already configured with Supabase credentials.

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Exploring the Demo

Visit [http://localhost:3000/demo](http://localhost:3000/demo) to:

1. **Experience the Flow**: Step through the complete hiring process
   - Employer creates a job
   - Candidates apply with resumes
   - AI matches candidates to jobs
   - Employer reviews anonymized shortlist
   - Feedback collection

2. **View Admin Tables**: See all database entities and their relationships

3. **Seed Mock Data**: Click "Seed Mock Data" to populate the database with sample records

## Project Structure

```
hire-io/
├── app/
│   ├── page.tsx              # Landing page
│   └── demo/
│       └── page.tsx          # Interactive demo
├── components/
│   ├── AdminTableView.tsx    # Admin dashboard tables
│   ├── AnonymizedShortlist.tsx # Candidate shortlist view
│   ├── CandidateProfileBuilder.tsx # Candidate onboarding
│   ├── JobIntakeWizard.tsx   # Job creation wizard
│   ├── LeniencySlider.tsx    # Hiring flexibility control
│   ├── ResumeUpload.tsx      # Resume upload & parsing
│   └── SalaryGauge.tsx       # Salary visualization
├── lib/
│   ├── supabase.ts           # Supabase client & types
│   └── auth.ts               # Authentication helpers
└── supabase/
    └── migrations/           # Database migrations
```

## Database Schema

### Tables

1. **employers** - Company profiles
2. **candidates** - Job seeker profiles with resume data
3. **jobs** - Job postings with requirements
4. **job_intake** - Detailed hiring preferences per job
5. **matches** - AI-generated candidate-job matches
6. **feedback** - Employer feedback on matches

All tables have Row Level Security (RLS) enabled to ensure data privacy.

## Phase 1 Roadmap

### High Priority TODOs

#### 1. Real Authentication
- [ ] Implement full Supabase auth flow (sign up, login, logout)
- [ ] Add user role management (employer vs candidate)
- [ ] Create protected routes and auth middleware
- [ ] Add password reset and email verification

#### 2. Real Resume Parsing
- [ ] Integrate PDF parsing library (e.g., pdf-parse)
- [ ] Implement text extraction from DOC/DOCX files
- [ ] Build NLP-based skill extraction
- [ ] Extract education, experience, and contact info
- [ ] Store resume files in Supabase Storage

#### 3. AI Matching Engine
- [ ] Design matching algorithm considering:
  - Skill overlap (required vs possessed)
  - Experience level alignment
  - Leniency score adjustments
  - Priority weighting
  - Dealbreaker enforcement
- [ ] Implement match score calculation (0-100)
- [ ] Add real-time matching when candidates apply
- [ ] Create batch matching jobs for existing candidates

#### 4. Full CRUD Operations
- [ ] Build employer dashboard to manage jobs
- [ ] Add job editing and deletion
- [ ] Create candidate application flow
- [ ] Implement match acceptance/rejection
- [ ] Add feedback submission forms

#### 5. Enhanced UI/UX
- [ ] Add loading states and skeletons
- [ ] Implement error boundaries and error handling
- [ ] Add toast notifications for user actions
- [ ] Create mobile-responsive layouts
- [ ] Add dark mode support

#### 6. Real-time Features
- [ ] Use Supabase Realtime for live updates
- [ ] Show new matches as they happen
- [ ] Live notification system
- [ ] Real-time shortlist collaboration

#### 7. Analytics & Insights
- [ ] Employer dashboard with hiring metrics
- [ ] Match quality analytics
- [ ] Time-to-hire tracking
- [ ] Candidate funnel visualization

#### 8. Communication
- [ ] In-app messaging between employers and candidates
- [ ] Email notifications (job matches, status updates)
- [ ] Interview scheduling integration

### Nice-to-Have Features

- [ ] Candidate search and filtering for employers
- [ ] Saved candidate lists
- [ ] Job templates for employers
- [ ] Candidate job alerts and recommendations
- [ ] Video interview integration
- [ ] Reference checking workflow
- [ ] Offer letter generation
- [ ] Onboarding checklist

### Technical Improvements

- [ ] Add comprehensive unit tests
- [ ] Implement E2E testing with Playwright
- [ ] Set up CI/CD pipeline
- [ ] Add logging and monitoring (e.g., Sentry)
- [ ] Optimize database queries and add indexes
- [ ] Implement caching strategy
- [ ] Add API rate limiting
- [ ] Create API documentation
- [ ] Set up staging environment

## Extending the Project

### Adding a New Component

1. Create component in `components/` directory
2. Use TypeScript for type safety
3. Follow existing design patterns (Tailwind CSS classes)
4. Export and import in relevant pages

### Adding a New Database Table

1. Create migration in `supabase/migrations/`
2. Use descriptive filename: `create_table_name.sql`
3. Include RLS policies for security
4. Add TypeScript types to `lib/supabase.ts`

### Adding a New Page

1. Create folder/file in `app/` directory
2. Export default React component
3. Use 'use client' directive if needed
4. Link from navigation

## Environment Variables

Required variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Security Notes

- All database tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Anonymous access is restricted
- Supabase handles authentication securely
- File uploads should be validated in production

## Known Limitations (Phase 0)

- Resume parsing uses placeholder logic
- Match scores are randomly generated
- No real authentication flow (stub only)
- Salary market data is hardcoded
- No persistent state between sessions
- Limited error handling
- No email notifications

## Contributing

This is Phase 0. For Phase 1, consider:

1. Following the roadmap priorities
2. Maintaining type safety
3. Writing tests for new features
4. Updating this README with changes
5. Following existing code patterns

## License

Proprietary - All rights reserved

## Contact

For questions about extending or deploying Hire.io, refer to the Phase 1 roadmap above.

---

**Current Status**: Phase 0 Complete ✓
**Next Milestone**: Phase 1 - Real Authentication & AI Matching
