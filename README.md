# Amarargarh High School Website

All-in-one school website with an online GUI admin dashboard.

## Features

- Full public website: Home, About, Admissions, Academics, Teachers, Achievements, Events, Notices, Contact
- Modern UI shell with responsive desktop/mobile navigation and 3-dot mobile menu
- Enhanced responsive design tuned for mobile, tablet, laptop, desktop, and large-screen displays
- Rich home dashboard with quick links, latest updates, teachers preview, and achievement memories
- Home page class-wise notice finder and magazine spotlight sections
- Advanced Events page with search + timeline filtering (upcoming/past/all)
- Advanced Notices page with search + recency filtering
- Class-wise notice filtering for Classes 5 to 10
- Teachers' Corner with portfolio cards and photos
- Student Achievements & Memory Wall with rank highlights and photos
- Magazine section for quotes, poems, and stories
- Online admin GUI at `/admin` for complete content operations
- Server-side admin authentication with DB-stored credentials
- First-time admin account creation flow inside `/admin`
- Recovery unlock after 5 failed login attempts using a server-configured Secret Pass
- Sectioned admin control panel with quick navigation tabs for each management area
- Admin credential change section (change Admin ID/password from dashboard)
- Edit site settings (school name, tagline, address, phone, email, principal message)
- Manage page content for all static sections (About, Admissions, Academics, Contact)
- Advanced per-page dynamic blocks (Text, Image, Lined/List) with ordering and active toggles
- Full lifecycle management for events, class notices, teachers, achievements, magazine entries, and dynamic blocks (create, update, delete)
- SQLite + Prisma data layer

## Tech Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- Prisma ORM
- SQLite (local)

## Run Locally

1. Install dependencies:
   - `npm install`
2. Create database and run migration:
   - `npx prisma migrate dev --name init`
3. Create `.env` from `.env.example` and set required values:
   - `ADMIN_SESSION_SECRET` (use a long random secret)
   - `ADMIN_RECOVERY_SECRET_PASS` (strong secret used for admin recovery)
   - `NEXT_PUBLIC_SITE_URL`
   - Optional: `ENABLE_RUNTIME_SEEDING=true` (development default; production default is disabled)
4. Start development server:
   - `npm run dev`
5. Open:
   - `http://localhost:3000`

## Admin Usage

- Visit `http://localhost:3000/admin`
- If no account exists, create the first Admin ID and password from the setup form
- If login fails 5 times, recovery form unlocks and requires Secret Pass + new credentials
- Update content using the forms
- Changes are reflected immediately on public pages

## Production Build

- `npm run build`
- `npm run start`

## Release Gate (Run Before Upload)

Run all checks and only publish if all pass:

- `npm run lint`
- `npm run build`
- `npm run test:smoke`
- `npm audit --omit=dev`

## Free Google Deployment + School Demo Docs

- Full zero-cost Google deployment runbook: `DEPLOY_GOOGLE_FREE.md`
- School presentation plan and demo script: `SCHOOL_PRESENTATION_CHECKLIST.md`

## Database Notes

- After schema/index updates, run Prisma migration before deployment:
   - `npx prisma migrate dev --name add-performance-indexes`

## Security Checklist (Before Publish)

- Set `ADMIN_SESSION_SECRET` to a strong random value (minimum 32 characters).
- Set `ADMIN_RECOVERY_SECRET_PASS` to a strong secret and keep it private.
- Ensure `NEXT_PUBLIC_SITE_URL` is your live HTTPS domain.
- Confirm `/admin` is not linked from public navigation (direct URL only).
- Verify TLS/HTTPS is enabled on hosting.
- Run:
   - `npm run lint`
   - `npm run build`
   - `npm audit --omit=dev`

## Notes

- Admin credentials are stored in the database (server-side), not in source files.
- Replace default school details with your real data from the admin dashboard.
- Use `npm run build` to validate production readiness after content or UI changes.
