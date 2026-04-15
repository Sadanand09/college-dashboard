# EduDesk — College Teacher Dashboard

A modern, full-stack teacher dashboard for managing students, attendance, assignments, grades, and announcements.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: Clerk v7
- **Database**: MongoDB + Mongoose
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Setup

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
# Clerk — get from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# MongoDB — get from https://cloud.mongodb.com
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/college-dashboard
```

### 2. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/sign-in` automatically.

## Features

| Page | What you can do |
|------|----------------|
| **Dashboard** | Summary cards, attendance trend chart, grade distribution chart, recent activity |
| **Students** | Add / edit / delete students, search + paginate |
| **Attendance** | Bulk mark attendance by class & date, view history |
| **Assignments** | Create / edit / delete assignments with deadlines, active/closed filter |
| **Grades** | Record marks, auto-calculate letter grades, bar charts per subject |
| **Announcements** | Post / pin / edit / delete announcements |
| **Profile** | Edit name, department, subjects, bio synced with Clerk |

## Project Structure

```
app/
  (auth)/sign-in, sign-up     # Clerk auth pages
  dashboard/                  # Protected pages (layout wraps all)
    page.tsx                  # Overview with charts
    students/
    attendance/
    assignments/
    grades/
    announcements/
    profile/
  api/                        # Route handlers (REST)
    students/[id]/
    attendance/
    assignments/[id]/
    grades/[id]/
    announcements/[id]/
    profile/
components/
  dashboard/  Sidebar, Navbar, DashboardShell
  ui/         Button, Modal, Badge, Toast, Skeleton
lib/
  mongodb.ts  Connection helper with global cache
models/
  Teacher, Student, Attendance, Assignment, Grade, Announcement
```

## Deployment (Vercel)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy
