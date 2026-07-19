# Sprint status (update when completing work)

Last updated: 2026-07-18

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
- [ ] Attendance: parent confirm + coach finalize per practice
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
- Production `DATABASE_URL` on Vercel uses Neon dev for preview
- Attendance page is placeholder until Sprint 2 item 3
