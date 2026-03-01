# Amarargarh Website Go-Live Checklist

## 1) Pre-Deployment

- [ ] Set production env vars:
  - `DATABASE_URL`
  - `ADMIN_SESSION_SECRET` (min 32 chars)
  - `ADMIN_RECOVERY_SECRET_PASS`
  - `NEXT_PUBLIC_SITE_URL`
  - `ENABLE_RUNTIME_SEEDING=false`
- [ ] Run DB migration:
  - `npx prisma migrate dev --name add-performance-indexes`
- [ ] Validate quality:
  - `npm run lint`
  - `npm run build`

## 2) Runtime Smoke Test

- [ ] Start app (`npm run start`) or deploy preview URL.
- [ ] Run route smoke test:
  - `npm run test:smoke`
  - Optional for deployed URL: `SMOKE_BASE_URL=https://your-domain.com npm run test:smoke`

## 3) Manual Normal-User Checks

- [ ] Theme toggle works (dark/light) and persists after reload.
- [ ] Home, About, Admissions, Academics, Contact load correctly.
- [ ] Teachers, Achievements, Events, Notices, Magazine show valid content.
- [ ] Privacy/Terms pages open and footer links work.
- [ ] Loading message appears only on delayed page transitions.

## 4) Manual Admin CRUD Smoke Test

Log in at `/admin` and verify all operations:

- [ ] Site Settings: update fields and verify home/footer reflect updates.
- [ ] Page Content: update About/Admissions/Academics/Contact and verify front-end.
- [ ] Important Boxes: create/update/delete and verify on target page.
- [ ] Events: create/update/delete and verify `/events` updates.
- [ ] Notices: create/update/delete and verify `/notices` updates.
- [ ] Teachers: create/update/delete with photo upload and verify `/teachers`.
- [ ] Achievements: create/update/delete with photo upload and verify `/achievements`.
- [ ] Magazine: create/update/delete and verify `/magazine`.
- [ ] Admin Security: change credentials and verify old credentials no longer work.

## 5) Security Verification

- [ ] `/admin` is not shown in public nav.
- [ ] Login throttling works after repeated wrong attempts.
- [ ] Recovery flow works only after lock threshold.
- [ ] Production HTTPS enabled.
- [ ] `npm audit --omit=dev` returns no high/critical vulnerabilities.

## 6) Final Sign-Off

- [ ] Backup database snapshot completed.
- [ ] Release notes prepared.
- [ ] Owner approval completed.
- [ ] Go live.
