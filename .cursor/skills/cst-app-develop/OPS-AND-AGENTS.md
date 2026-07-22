# Running ops & agents from your phone (no local terminal)

Goal: never have to open a terminal on a computer to run database tasks, seed
data, or apply migrations. Three mechanisms, by task type.

| Task type | Use | Where you tap |
|---|---|---|
| Recurring admin ops (load hours, roles, notices) | In-app admin buttons | The app itself |
| Run an existing repo script / migration | **Ops runner** GitHub Action | GitHub mobile → Actions |
| Build a feature / write + run a new script | **Cloud Agent** (with DB secret) | Cursor mobile |

---

## 1. Ops runner (GitHub Action) — run scripts from GitHub mobile

Workflow: `.github/workflows/ops-runner.yml`. Runs in the cloud with database
credentials, so no local machine is involved.

### One-time setup (repo → Settings → Environments)

1. **Environment `dev`**
   - Secret `DATABASE_URL` = Neon **dev** branch (pooled connection string)
   - No protection rules → runs immediately
2. **Environment `production`**
   - Secret `DATABASE_URL` = Neon **main** branch (pooled connection string)
   - Protection rule **Required reviewers = you** → manual approval gate

> The prod gate means: an agent (or anyone) can *request* a prod ops run, but it
> only executes after **you approve it** on GitHub. Agents never change
> production on their own.

### Running a task (phone)

1. GitHub mobile app (or github.com) → repo **CST-APP** → **Actions**
2. **Ops runner** → **Run workflow**
3. Pick **task** (e.g. `seed-brossard-hours`) and **target** (`dev` or `production`)
4. **Run**. For `production`, you'll get an approval prompt — approve to proceed.
5. Watch the run log for success.

### Available tasks

| Task | What it does |
|---|---|
| `seed-base (venues + fleet)` | `npm run db:seed` — base venues + 2 fleet cars |
| `seed-brossard-hours` | `npm run db:seed:brossard` — Brossard Summer/Winter hours |
| `seed-ali-schedule` | Ali (St-Laurent) demo season |
| `grant-staff-roles` | Grant configured staff their roles |
| `normalize-roles` | Clean up duplicate/parent+staff role combos |
| `migrate-registrations` | Ensure `registrations` table exists |
| `db-push (apply schema changes)` | `drizzle-kit push` — **schema migration** |

> `db-push` against `production` can involve data-loss statements on destructive
> changes. Keep it gated (manual approval) and prefer running on `dev` first.

---

## 2. Cloud Agent DB access — so agents populate dev without you

To let a dispatched Cloud Agent run DB scripts against **dev** itself (e.g.
"seed the Brossard hours on dev and screenshot the calendar"), the agent VM
needs the dev connection string.

### Add the secret (you, once)

Cursor → **Cloud Agents → Secrets** → add:

- `DATABASE_URL` = Neon **dev** pooled connection string
- (optional, for running the app) `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` = Clerk **test** keys

Scope these to the `JEYKOD3/CST-APP` repo. **Only add dev/test credentials** —
never the Neon `main` (production) string or Clerk live keys. Production changes
stay behind the Ops runner's manual approval gate.

### Env setup agent prompt (paste at cursor.com/onboard)

Run an **environment setup agent** so future Cloud Agents boot ready to run DB
tasks on dev:

```
Configure the Cloud Agent environment for JEYKOD3/CST-APP (Next.js 16 + Drizzle + Neon).
- On startup: run `npm ci` so the app builds and `npm run verify` works.
- Make the repo's DB scripts runnable against the DEV database using the
  `DATABASE_URL` secret (Neon dev pooled string): `npm run db:seed`,
  `npm run db:seed:brossard`, `npm run db:push`, and the scripts under `scripts/`.
- Confirm `npx tsx scripts/seed-brossard-hours.ts` can connect to dev.
- Do NOT add or use the Neon `main` (production) connection string or Clerk live
  keys in this environment. Production ops run only via the GitHub "Ops runner"
  workflow with its manual approval gate.
- Leave lint/test/build (`npm run verify`) green.
```

After it runs, a normal Cloud Agent prompt like *"seed the Brossard hours on dev
and show me the schedule"* will work end to end.

---

## 3. Working model (mobile-first)

- **Everyday schedule changes** → in the app (admins, non-coders): Schedule →
  Manage, or a practice's detail page. See below.
- **Data fixes / migrations** → Ops runner from GitHub mobile.
- **New features / code** → Cloud Agent from Cursor mobile → review the PR on
  GitHub → merge → Vercel preview → production.

### What admins can already do in-app (no code)

- Create a season; generate recurring practices per venue/level/weekday/time.
- One-tap **Load Brossard hours**.
- **Reschedule / move** a practice (change venue, date, time) — notifies parents + coaches.
- **Cancel** a practice — notifies everyone.
- Assign / unassign coaches per practice.
- Add a one-off practice.

### Planned (see SPRINT-STATUS.md)

- Edit a **whole series/season** in bulk (change the weekly time/day and
  re-materialize future occurrences) and discontinue a series from the UI.
