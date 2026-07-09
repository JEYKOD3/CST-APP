# CST App — Context map

Read these **instead of** broad repo exploration. Full layout: [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md).

## Product (one line)

One master schedule + per-practice attendance rosters. Parents sign in; one account → many kids. Staff roles are modifiable in-app.

## Directory map

```
src/
  app/                      # Routes only (thin pages)
    (app)/                  # Authenticated shell
    api/                    # Route handlers
    sign-in/ sign-up/
  components/
    layout/                 # bottom-nav, app chrome
    ui/                     # shared primitives (future shadcn)
  features/                 # Domain logic — add new code here
    children/               # actions.ts, queries.ts, components/
    team/
    schedule/
  lib/                      # auth.ts, roles.ts (cross-cutting)
  db/                       # schema.ts, index.ts
scripts/seed.ts             # Venues, fleet, sample schedule
design/assets/              # Mockups only
public/                     # Served static files (logo, manifest)
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
