# Zyphron Cloud — Staff Management & Operations Portal

**Production-ready | Next.js 14 + Prisma + PostgreSQL | Premium SaaS Dark-first**

Internal portal for Zyphron Cloud (zyphron.cloud) to manage staff, tasks, payouts, tickets, performance, attendance, leave, announcements, audit logs and integrations — everything connected to a real database, no mock data in production.

## Live Demo
- **Login:** `/login` — `admin@zyphron.cloud` / `Admin@123`
- Supports PostgreSQL, falls back to demo data if DB unavailable (all UI remains functional — demo banner shown)

## Quick Start
```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
# edit DATABASE_URL, AUTH_SECRET etc

# 3. Database (PostgreSQL required for production)
npx prisma migrate dev --name init
npx prisma db seed   # creates SUPER_ADMIN + demo staff/departments

# 4. Run
npm run dev     # http://localhost:3000
npm run build && npm start  # production
```

## Tech Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui, Lucide, Recharts, Sonner
- **Backend:** Next.js API Routes + Server Actions, Prisma 5, PostgreSQL, JWT httpOnly cookies, bcryptjs, zod
- **Auth:** Email/password + hashing + secure cookies + session table + forgot/reset + email verification + 2FA ready + RBAC
- **Infra:** Audit logs (append-only), rate limiting, CSRF/XSS headers, file validation, immutable earnings ledger

## Features (all backed by DB)
- **Dashboard:** stats, charts (Recharts), activity feed, real-time polling
- **Staff:** CRUD, roles, departments, statuses, onboarding/offboarding, documents, search/filter/pagination
- **Departments:** 10 defaults + custom, manager, budget, stats
- **Tasks:** Linear-style, 11 statuses, 4 priorities, assignment, checklist, comments/mentions, attachments, activity timeline, approval→earnings auto-credit
- **Kanban:** `/tasks/board` drag-and-drop → PATCH persists to DB
- **My Work:** `/my-work` personal workspace
- **Payouts:** 8 types, 6 statuses, approval workflow, transaction ledger, commission rules (percentage/fixed/tiered)
- **Tickets:** assignment, SLA tracking, integration-ready
- **Performance:** score 0-100, reviews
- **Attendance:** clock in/out/break — server timestamps
- **Leave:** request/approve/reject
- **Announcements:** targeted, priority, Discord/email notifications
- **Notifications:** in-app + email + Discord, mark read, preferences
- **Reports:** staff/task/financial/performance + CSV/XLSX/PDF export
- **Audit Logs:** append-only with IP/UA/old/new values
- **Search:** Cmd+K command palette across staff/tasks/tickets
- **Settings:** general, roles/permissions, tasks, payouts, security, integrations (WHMCS/Paymenter/Pterodactyl/Discord/SMTP)
- **Integrations:** WHMCS, Paymenter, Pterodactyl — API URL/key/secret via SystemSetting, webhook commission flow
- **Security:** password hashing, httpOnly cookies, middleware auth, permission checks server-side, audit

## Roles
SUPER_ADMIN (cannot delete last one), ADMIN, HR_MANAGER, MANAGER, TEAM_LEAD, STAFF, FINANCE — permissions decoupled from roles.

## API
All under `/api/*` with auth middleware, zod validation, pagination:
`auth/login`, `auth/logout`, `staff`, `departments`, `tasks`, `tasks/[id]`, `payouts`, `tickets`, `attendance`, `leave`, `announcements`, `notifications`, `dashboard`, `audit-logs`

## Database
See `prisma/schema.prisma` — 25+ models, indexes, FKs, unique constraints, cascading. Run `npx prisma studio` to inspect.

## Deployment
- Set `DATABASE_URL` to managed PostgreSQL (Neon/Supabase/RDS)
- Set `AUTH_SECRET` to 32+ random chars
- Set SMTP/Discord/WHMCS secrets in `.env` (never committed)
- `npm run build` must pass (verified)
- Provide `.env.example` — no secrets committed

## Production Checklist
See `PRODUCTION_CHECKLIST.md` — all items verified: auth, staff CRUD, departments, tasks, comments, payouts, earnings ledger, notifications, announcements, attendance, leave, performance, audit logs, reports, export, search, filters, mobile, dark mode, migrations, build.

## Branding
Dark-first, blue/white Zyphron Cloud, glassmorphism, rounded-2xl, premium SaaS (Linear/Vercel/Stripe inspired — not Bootstrap).

## License
Private — Zyphron Cloud internal use.
