# CivicPulse — AI-Powered Civic Grievance Lodging & Tracking

A civic grievance management system where citizens can submit complaints, officers can manage department-specific queues, and admins have full oversight. Built as a modular foundation for AI feature integration.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS 4
- **Backend:** Supabase (Auth, Postgres, Storage, RLS)
- **Language:** TypeScript

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your Supabase credentials
cp .env.local.example .env.local

# 3. Run the SQL migration in your Supabase SQL Editor
#    File: supabase/migrations/001_initial_schema.sql

# 4. Start dev server
npm run dev
```

## Folder Structure

```
civic-grievance/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx          # Centered auth card layout
│   │   ├── login/page.tsx      # Email + password login
│   │   └── signup/page.tsx     # Signup with role/department selection
│   ├── citizen/
│   │   ├── layout.tsx          # Auth guard (citizen only)
│   │   ├── page.tsx            # Citizen dashboard — own complaints list
│   │   ├── new/page.tsx        # Submit new complaint form
│   │   └── [id]/page.tsx       # Complaint detail + timeline
│   ├── officer/
│   │   ├── layout.tsx          # Auth guard (officer only)
│   │   ├── page.tsx            # Officer dashboard — department queue
│   │   └── [id]/page.tsx       # Complaint detail + status update
│   ├── admin/
│   │   ├── layout.tsx          # Auth guard (admin only)
│   │   ├── page.tsx            # Admin dashboard — counts & breakdowns
│   │   └── complaints/page.tsx # All complaints with filters
│   ├── globals.css             # Design system tokens
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Root redirect by role
├── components/
│   ├── ErrorMessage.tsx        # Reusable error state
│   ├── LoadingSpinner.tsx      # Reusable loading state
│   ├── Navbar.tsx              # Role-aware navigation bar
│   └── StatusBadge.tsx         # Colored status pill component
├── lib/
│   ├── queries/
│   │   ├── complaints.ts       # All complaint CRUD + analytics queries
│   │   ├── departments.ts      # Department queries
│   │   └── profiles.ts         # Profile queries
│   ├── routing/
│   │   └── keywordRouter.ts    # ⚡ Keyword-based complaint classifier
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── middleware.ts       # Session refresh + role-based redirects
│   │   └── server.ts           # Server Component Supabase client
│   └── types.ts                # Shared TypeScript types
├── middleware.ts                # Next.js middleware entry point
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full DB schema + RLS + storage bucket
└── .env.local.example          # Required environment variables
```

## Where to Plug In AI Features

This codebase is designed for **5 teammates to work in parallel** on AI features.
Each feature has a clearly defined integration point:

### 1. 🤖 LLM-Based Complaint Classification
**File:** `lib/routing/keywordRouter.ts`
**What to do:** Replace the `classifyComplaint()` function with an LLM call.
Keep the same return signature `{ category: string, departmentName: string }`.
The function is already called in `app/citizen/new/page.tsx`.

### 2. 🔍 Duplicate Detection
**File:** Create `lib/ai/duplicateDetector.ts`
**Where to call it:** In `app/citizen/new/page.tsx`, after classification but before inserting
the complaint. Show a warning if a likely duplicate is found.

### 3. 📸 Image Analysis
**File:** Create `lib/ai/imageAnalyzer.ts`
**Where to call it:** In `app/citizen/new/page.tsx`, when an image is uploaded.
Use the analysis to enhance the complaint description or auto-fill category.

### 4. 📊 Admin Analytics / Insights
**File:** Extend `lib/queries/complaints.ts` or create `lib/ai/analyticsEngine.ts`
**Where to display:** In `app/admin/page.tsx`. Add AI-generated insights like
trending categories, resolution time predictions, or anomaly detection.

### 5. 💬 Chatbot / Natural Language Interface
**File:** Create `lib/ai/chatbot.ts` + `components/ChatWidget.tsx`
**Where to mount:** In the citizen layout. Allow citizens to describe issues
conversationally and auto-fill the complaint form.

## Database Schema

See `supabase/migrations/001_initial_schema.sql` for the full schema including:
- **profiles** — User profiles with roles (citizen/officer/admin)
- **departments** — Pre-seeded: Water Supply, Electricity, Roads, Sanitation, Other
- **complaints** — Grievances with status workflow
- **complaint_updates** — Audit trail of status changes
- **Storage bucket** — `complaint-images` with public read access

## Roles & Access Control

| Role    | Can See                    | Can Do                          |
|---------|----------------------------|---------------------------------|
| Citizen | Own complaints only        | Submit complaints               |
| Officer | Department complaints only | Update status, add notes        |
| Admin   | All complaints             | View analytics, manage all data |

All access is enforced at the **database level** via Supabase RLS policies.
