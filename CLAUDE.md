# CST Badminton Club — Agent instructions

Read `SETUP.md` and the project plan before coding.

## Product goal

**One synchronized schedule** — coaches, admins, and parents see the same plan. Track **attendance rosters per practice** (no texting name lists).

## Stack

Next.js App Router · Clerk auth · Neon Postgres · Drizzle ORM · Tailwind · shadcn (add as needed)

## Domain rules

- **Roles are modifiable** — add/remove coaches, admins, parents via app (not hardcoded). Mohammad + Ghaida = super_admin + coach; both help practices and privates.
- **Parents sign in** — one parent account → **many children** (~99% of players). Teenagers may have own login (`is_teen_self_managed`).
- **Player level required**: beginner | intermediate | advanced | elite
- **4 practice venues** seeded in `scripts/seed.ts`
- **Fleet**: 2 Teslas; location Atwater/Brossard; charged = ≥30% battery (boolean for v1)
- **Mobile-first** for coaches and admins at the gym; desktop is enhanced layout only
- **Training-first** court rental (Sprint 4)

## Git rules

- Feature branch per sprint (`sprint-1-foundation`, etc.)
- Never force push; never auto-deploy to production
- Run `npm run verify` before finishing (lint + test + build)
- **Always open a PR** — see `.cursor/skills/cst-app-develop/PR-WORKFLOW.md`

## Agent skill (read first)

All agents follow **`.cursor/skills/cst-app-develop/SKILL.md`** and **`.cursor/skills/cst-app-develop/PROJECT-STRUCTURE.md`** for file placement.

## Autonomy

- Safe: scaffold, UI, migrations, tests, preview deploy
- Ask user: payment logic, schema breaking changes, production deploy

## Staff (seed invites after auth works)

- Ghaida: ghaidaghaniyu.cstbrossard@gmail.com (super_admin + coach)
- Mohammad: m.h.vakili@gmail.com (super_admin + coach)
- Yao: jeanyao5787@gmail.com (coach)
