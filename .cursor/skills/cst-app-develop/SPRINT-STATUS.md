# Sprint status (update when completing work)

Last updated: 2026-07-19

## Sprint 1 — Foundation ✅ (merged)

- [x] Next.js + Clerk + Neon + Drizzle
- [x] Schema: users, roles, players, schedule, attendance, fleet, notices
- [x] User sync on login + staff bootstrap emails
- [x] Dashboard, schedule read, children CRUD
- [x] Admin hub: invites, role management, duplicate prevention, add players
- [x] PWA manifest, CST branding, SETUP.md

## Sprint 2 — Operations (in progress on `sprint-2-registration`)

- [x] Summer registration form + e-transfer reference + optional proof upload
- [x] Admin payment approval queue (manual approve/reject)
- [x] Attendance: parent confirm + coach finalize per practice (roster built from parent confirmations; indexed for scale)
- [x] Player levels reduced to beginner / intermediate / elite (removed `advanced`)
- [x] Synchronized calendar (agenda, role-aware, level/venue filters, infinite date range)
  - [x] Seasons + recurring practice series → materialized dated `schedule_events`
  - [x] Admin: create season, generate recurring practices per venue/level/weekday, add one-off, edit/cancel, assign coaches
  - [x] Coach view: assigned coaches + available charged car (fleet)
  - [x] In-app notifications on schedule change / cancel / coach assignment (dashboard + header badge + /notifications)
- [ ] Private lessons on the calendar (next)
- [ ] Web push notifications (currently in-app only)
- [x] Brossard training hours seeded (`npm run db:seed:brossard`): Summer to Sep 30 (Mon/Tue/Wed 8–10 PM, Sat 1:30–3:30, Sun 1–3), Winter Sep→Feb (Sun 3:15–5:15)
- [x] Per-season venues: admin creates a season with dates (any of the 4 badminton seasons) + attributes which venues it uses; recurring-practice venue picker scoped to the season's venues. In-app venue management (add/edit/deactivate) at `/schedule/venues` for court-rental changes
- [ ] Per-venue distinct schedules beyond Ali + Brossard (data entry via Manage UI)
- [ ] Admin-scheduled privates on master calendar
- [ ] Notices publish UI

## Sprint 3 — Engagement

- [ ] In-app chat
- [ ] Coaching / stringing / merchandise requests
- [ ] Feedback

## Sprint 4 — Advanced

- [ ] Court rental (training-first)
- [ ] Fleet v1 UI
- [ ] Payment reminders / automation

## Known gaps

- Proof upload needs `BLOB_READ_WRITE_TOKEN` on Vercel (optional — reference-only works without it)
- Registration amounts / auto-approve rules not set — manual review only
- Attendance page is placeholder until Sprint 2 item 3

---

# 🚀 Production launch checklist

**Do this full check-up before opening the app to real parents/coaches.**
Today the app runs fine on preview + local (Neon `dev` branch, Clerk test keys). The items below are what separates "works for us in testing" from "safe for real users".

## 1. Clerk — switch to a production instance ⚠️ REQUIRED

Currently prod uses **test keys** (`pk_test_...`, instance `settled-ox-29.clerk.accounts.dev`). Dev instances cap at ~100 users, show a dev banner, and use shared OAuth creds — not for real users.

- [ ] Create a **Production instance** in the Clerk dashboard
- [ ] Pick a domain for Clerk (e.g. `clerk.<ourdomain>`) and add the **DNS records** Clerk provides
- [ ] Copy the new **`pk_live_...`** and **`sk_live_...`** keys
- [ ] Update Vercel **Production** env (leave preview/dev on test keys):
  - `vercel env rm NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production` then `add` → `pk_live_...`
  - `vercel env rm CLERK_SECRET_KEY production` then `add` → `sk_live_...`
- [ ] Configure OAuth redirect URLs / allowed origins for the prod domain in Clerk
- [ ] Confirm staff bootstrap emails still sign in with the `super_admin + coach` role on the live instance

## 2. Database — Neon `main` branch ✅ DONE (2026-07-19)

- [x] Full schema pushed to Neon `main` (prod) — all 12 tables incl. `registrations`, `pending_role_assignments`
- [x] Base data seeded (4 venues, 2 fleet vehicles)
- [ ] Re-run `db:push` against `main` after any future schema change (prod migrations are NOT automatic)
  - Pending on `main`: attendance indexes added 2026-07-19 (`attendance_event_player_idx`, `attendance_player_idx`, `players_*_idx`, `schedule_events_*_idx`) — already on `dev`
  - Pending on `main`: calendar schema (`seasons`, `practice_series`, `notifications` tables; `schedule_events.level/series_id/canceled`; `notification_type` enum) — already on `dev`
  - Pending on `main`: `player_level` enum reduced to beginner/intermediate/elite. Prod `main` is empty so a fresh `db:push` creates the 3-value enum directly (no recreate dance needed).
- [ ] (Optional) Drop the unused `staff_invites` table left over from the merged admin-hub PR

## 3. Domain & deployment

- [ ] Buy / connect a custom domain in Vercel (replaces `cst-app-lake.vercel.app`)
- [ ] Set `NEXT_PUBLIC_APP_URL` (Production) to the real domain
- [ ] Verify the Clerk domain + app domain match
- [ ] Do a real production deploy and smoke-test sign-in on the live domain

## 4. Storage — Vercel Blob

- [ ] Confirm `BLOB_READ_WRITE_TOKEN` is set on Production
- [ ] Upload + view a real payment proof end-to-end in prod (private access via `/api/registrations/[id]/proof`)

## 5. Data & access sanity

- [ ] Confirm `jeanyao5787@gmail.com` (and any tester) land as **parent** in prod
- [ ] Confirm the last-super-admin safeguard works (can't remove the final super admin)
- [ ] Seed / invite the real staff (Ghaida, Mohammad, Yao) and verify their roles

## 6. Pre-flight

- [ ] `npm run verify` green on the release branch
- [ ] Registration amounts / e-transfer instructions finalized and shown to parents
- [ ] Decide French/English copy is correct on parent-facing pages
