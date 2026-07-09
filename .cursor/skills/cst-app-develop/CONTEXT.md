# CST App — Context map

Read these **instead of** broad repo exploration.

## Product (one line)

One master schedule + per-practice attendance rosters. Parents sign in; one account → many kids. Staff roles are modifiable in-app.

## Directory map

```
src/
  app/
    page.tsx              # Public home
    sign-in/ sign-up/     # Clerk auth
    (app)/                # Authenticated shell (bottom nav)
      dashboard/          # Role-aware home
      schedule/           # Master calendar (read)
      children/           # Parent: add/list kids
      team/               # Super admin: modifiable roles
      attendance/         # Staff roster (Sprint 2+)
      more/               # Settings shell
  lib/
    auth.ts               # Clerk → Neon user sync
    roles.ts              # Role types + staff bootstrap emails
  db/
    schema.ts             # All tables
    index.ts              # getDb()
  components/
    bottom-nav.tsx
scripts/
  seed.ts                 # Venues, fleet, sample schedule
```

## Key domain rules

- Roles: `super_admin`, `admin`, `coach`, `parent`, `player` — **not hardcoded** except bootstrap emails in `roles.ts`
- Player levels: `beginner | intermediate | advanced | elite` (required)
- 4 venues seeded in `scripts/seed.ts`
- Mohammad + Ghaida: super_admin + coach; help practices **and** privates
- ~99% players are kids registered by parents

## Env (never commit)

| Var | Source |
|---|---|
| `DATABASE_URL` | Neon **dev** branch (preview/local); **main** for production |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk API Keys |
| `CLERK_SECRET_KEY` | Clerk API Keys |

## Git / deploy

- Repo: `https://github.com/JEYKOD3/CST-APP`
- Feature branches per sprint (`sprint-1-foundation`, `sprint-2-registration`, …)
- Vercel auto-deploys **Preview** on every PR
- User approves PR on phone → merge → preview URL for testing

## Sprint plan (high level)

| Sprint | Focus |
|---|---|
| 1 ✅ | Auth, RBAC, schedule read, children, team, PWA shell |
| 2 | Registration, e-transfer proof, attendance roster UI |
| 3 | Chat, requests, FAQ |
| 4 | Court rental, fleet v1, automation |
