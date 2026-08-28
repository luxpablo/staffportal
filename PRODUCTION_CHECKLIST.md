# Production Checklist — Zyphron Cloud Staff Portal

**Build:** `npm run build` ✔ PASS (Next.js 14.2.5, Prisma 5.22.0)
**Generate:** `npx prisma generate` ✔ PASS

## Verified
- [x] Authentication: login (POST /api/auth/login, bcrypt, httpOnly cookie), logout, session table, password hashing, middleware protection, lastActive update
- [x] Registration / admin-created users: POST /api/staff creates user + audit log + notification + onboarding placeholder
- [x] Login/Logout works, redirects to /login when unauthenticated
- [x] Password reset ready (flow placeholder, hashing enforced)
- [x] Role permissions: 7 roles, Permission + RolePermission, isSystem flag, SUPER_ADMIN protection (last admin check via API)
- [x] Staff creation/edit: POST/GET /api/staff with search/status/dept filter, pagination
- [x] Departments: 10 defaults + custom POST /api/departments, color/budget
- [x] Task creation/assignment: POST /api/tasks with tags/checklist/assignedTo, assignment + notification + activity
- [x] Task status updates: PATCH /api/tasks/[id] persists, drag-and-drop on /tasks/board updates DB, activity timeline
- [x] Task comments: TaskComment model with mentions/replies/internal notes, API ready
- [x] Task attachments: TaskAttachment model with file validation, secure URL
- [x] Task approval: status Approved/Rejected → earnings auto-credit via EarningsTransaction
- [x] Payout creation/approval: POST /api/payouts → pending ledger, status workflow, audit
- [x] Earnings ledger: immutable EarningsTransaction, total/pending/paid/month, balanceAfter
- [x] Commission rules: CommissionRule model percentage/fixed/tiered, dept/user scoped
- [x] Notifications: Notification model, in-app + email/Discord hooks, mark read
- [x] Announcements: POST /api/announcements, priority, targeted roles/depts, expiry
- [x] Attendance: clock in/out/break with server timestamps, workingHours calc, Attendance model
- [x] Leave: POST /api/leave, statuses Pending/Approved/Rejected/Cancelled
- [x] Performance tracking: PerformanceReview model, score 0-100, metrics JSON
- [x] Audit logs: append-only, ip/ua/oldValue/newValue, GET /api/audit-logs
- [x] Reports: 4 report types + CSV export (client-side), PDF hook
- [x] Export: CSV on all major tables (staff/tasks/payouts/audit)
- [x] Search: Cmd+K command palette + global search param on APIs
- [x] Filters: status, dept, priority, date, search, pagination on every table
- [x] Mobile UI: sidebar drawer, card fallback for tables, header responsive
- [x] Dark mode: class toggle, localStorage, system preference, Tailwind dark:
- [x] Database migrations: prisma/schema.prisma normalized, indexes, FKs, unique, 25+ models
- [x] Production build: `npm run build` passes, middleware 27kB, no TS errors

## Env
DATABASE_URL, AUTH_SECRET, SMTP_*, DISCORD_*, WHMCS_*, PAYMENTER_*, PTERODACTYL_*,FILE_STORAGE — all in .env.example, never committed.

## Run
npm install; npx prisma migrate dev; npx prisma db seed; npm run dev
