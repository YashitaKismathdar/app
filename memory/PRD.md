# WavyGo OS — PRD

## Status
- **Part 1 — Foundation & Core Platform: ✅ COMPLETE & FROZEN (Feb 2026)**
- **Part 2 — Core Business Modules (Marketplace, Task Board, Employees, Opportunity Hub, WavyGo Connect, Enhanced Founder Dashboard): ✅ COMPLETE & FROZEN (Feb 2026)**
- Confirmed by founder (Anil Anand). No further changes to Part 1 or Part 2 scope. Details in `/app/memory/PART2_FROZEN.md`.

## Frozen contracts (do NOT change in future phases)
- **Brand**: primary green `#0F8D52` from the official logo. Green logo on light mode, white logo on dark mode. Never regenerate or restyle the logo, never change primary color.
- **Typography**: Space Grotesk (headings) + Inter (body).
- **Palette tokens** (light + dark) as defined in `/app/frontend/src/index.css` and `/app/frontend/tailwind.config.js`.
- **Sidebar order (17 items, frozen — no rename, no reorder)**: Dashboard, Marketplace, Task Board, Opportunity Hub, Employees, WavyGo Connect, Company Vault, Finance, CRM, Marketing, Analytics, Calendar, WavyGo AI, About WavyGo, Activity Logs, Notifications, Settings.
- **Roles (frozen)**: Founder, Admin, Manager, Employee, Intern.
- **App shell**: `AppShell` = `Sidebar` + `TopNav` + `main`. Every future page must render inside `AppShell` — no custom shells, no route-level redesigns.
- **Auth contract**: JWT (12h access + 30d refresh) via `Authorization: Bearer <token>`, `require_roles(...)` dependency for role-gated endpoints.
- **Backend base**: FastAPI + Motor + MongoDB. All routes prefixed `/api`. Models use `PyObjectId` + `BaseDocument`.
- **Reusable primitives (do not fork)**: Shadcn UI components in `/app/frontend/src/components/ui/`, `WavygoLogo`, `AppShell`, `Sidebar`, `TopNav`, `NotificationDrawer`, `QuickCreateDialog`, `ProtectedRoute`, `AuthContext`, `ThemeContext`, `lib/api.js`, `constants/nav.js`, `constants/testIds.js`.

## Company
WAVYGO MOBILITY SERVICES PRIVATE LIMITED · CIN U77100BR2025PTC077095 · Travel-Tech / Mobility / Two-Wheeler Rental · India.

## Personas
- **Founder** (Anil Anand · anilanand635@gmail.com) — full access.
- **Admin / Manager / Employee / Intern** — descending permissions per `require_roles`.

## Part 1 — Delivered (frozen)
### Backend (`/app/backend`)
- Modular routers: `/api/auth`, `/api/users`, `/api/notifications`, `/api/activity`, `/api/dashboard`, `/api/settings`.
- JWT auth (bcrypt hash, access + refresh, refresh rotation on `/auth/refresh`).
- `require_roles` dependency for role-gated endpoints (`GET /api/users` = Founder/Admin/Manager).
- Idempotent seed on startup — 5 role accounts (Founder = anilanand635@gmail.com).
- Collections + indexes: `users`, `sessions`, `notifications`, `activity_logs`.
- Founder dashboard aggregate + public `/dashboard/live-kpis` for the login hero.
- Central Activity Log — writes on sign-in/out, register, password change; every future module must publish here.

### Frontend (`/app/frontend/src`)
- Design tokens (light + dark) in `index.css`; Space Grotesk + Inter loaded.
- Split-screen premium **Login** (official logo, floating KPI cards via Framer Motion, live KPIs, CIN in footer).
- Persistent **App Shell**: collapsible sidebar (17 items in frozen order + dynamic user block), top nav (⌘K command palette, Quick Create, notification bell w/ unread badge, theme toggle, time-aware greeting, avatar menu).
- Founder **Dashboard**: 5 KPIs + revenue area chart + weekly bookings bar chart + city performance table + today's tasks + upcoming calendar + quick actions + recent activity + opportunity summary.
- **Notifications** drawer + page. **Activity Logs** page (filterable). **Settings** (Profile / Company / Theme / Security / Roles). **About WavyGo**.
- 12 module placeholders wired into the shell for Phase 2/3 modules.
- All interactive elements carry `data-testid`. Toasts via Sonner (bottom-right).
- **QA**: backend 19/19 pytest ✅, frontend Playwright suite ✅.

## Roadmap (as confirmed by founder)
### Part 2 — Team & Collaboration (next)
1. **Employees** — directory, invites, role assignment UI.
2. **Task Board** — kanban with role-scoped assignment.
3. **WavyGo Connect** — internal announcements / social.
4. **Company Vault** — document storage (needs object-storage integration).
5. **Opportunity Hub** — deal pipeline.
6. **Calendar** — events + reminders wired to Notifications.

### Part 3 — Business Operations
7. **Marketplace** — vehicles, vendors, bookings (core rental engine).
8. **CRM** — customer 360.
9. **Finance** — invoices, payouts, statements.
10. **Marketing** — campaigns.
11. **Analytics** — cohorts, retention, city drill-down.
12. **About WavyGo** — expand company page.

### Part 4 — AI, Enterprise & Production
13. **WavyGo AI** — LLM assistant across modules.
14. **Enterprise features** — SSO, audit exports, advanced RBAC.
15. **Performance optimization** — bundle, DB indexing, caching.
16. **Security hardening** — rate limiting, brute-force protection, secret rotation.
17. **Deployment** — production infra, backups, monitoring.
18. **Final production polish**.

## Rules for every future phase
- Reuse the App Shell, design tokens, Shadcn primitives and existing testIds — do not fork or restyle.
- New backend collections extend the current `PyObjectId` + `BaseDocument` pattern.
- Every new user-facing action must write to `activity_logs`.
- Every new notification must go through the existing notifications collection + drawer.
- Every new module must live inside `AppShell` and match one of the 17 frozen sidebar entries.

