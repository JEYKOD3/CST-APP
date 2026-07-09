---
name: cst-app-develop
description: >-
  Develops CST Badminton Club app features with persistent context, tests,
  verification, and GitHub PRs. Use for any CST app work — Cursor desktop,
  phone, or Cloud Agent — including new features, fixes, schema, UI, and deploys.
---

# CST App Development

## Start here (every session)

1. Read [SPRINT-STATUS.md](SPRINT-STATUS.md) — what's done, what's next
2. Read [CONTEXT.md](CONTEXT.md) + [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) — where files go
3. Skim `CLAUDE.md` + `SETUP.md` only if the task touches auth, DB, or deploy
4. If scope is unclear → [QUESTIONS.md](QUESTIONS.md) — ask before coding

**Token rule:** Pull facts from project files, not conversation memory. Grep/read targeted paths only. **Never** create files outside [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md).

## Implementation loop

```
Task Progress:
- [ ] 1. Confirm sprint + branch (see PR-WORKFLOW.md)
- [ ] 2. Read only files the feature touches; place code per PROJECT-STRUCTURE.md
- [ ] 3. Implement smallest correct diff
- [ ] 4. Add/update tests (see TESTING.md)
- [ ] 5. Run scripts/verify.sh — fix until green
- [ ] 6. Update SPRINT-STATUS.md if sprint scope changed
- [ ] 7. Commit → push → open PR (mandatory)
```

### If verify fails

1. Read the error output — do not retry blindly
2. Fix root cause; prefer matching existing patterns in `src/`
3. Re-run `verify.sh` (max 3 fix attempts)
4. Still failing → document blocker in PR body; ask user via QUESTIONS.md

### If requirements are unknown

Stop and ask. Do not implement payment rules, production deploy, or breaking schema changes without approval (`CLAUDE.md` autonomy rules).

## Mandatory deliverables per feature

| Deliverable | Required |
|---|---|
| Code + tests for new behavior | Yes |
| `npm run lint && npm run test:run && npm run build` | Yes |
| PR to GitHub (not direct merge to main) | Yes |
| Update `SPRINT-STATUS.md` | If sprint item completed |

## Stack reminders

Next.js 16 App Router · Clerk v7 (`Show` not `SignedIn`) · Neon · Drizzle · Tailwind · mobile-first

## Reference files

| Topic | File |
|---|---|
| **File layout + naming** | [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) |
| Product + domain rules | `CLAUDE.md` |
| Env + Clerk + Neon + Vercel | `SETUP.md` |
| DB schema | `src/db/schema.ts` |
| Auth + roles | `src/lib/auth.ts`, `src/lib/roles.ts` |
| Sprint backlog | [SPRINT-STATUS.md](SPRINT-STATUS.md) |
| Tests | [TESTING.md](TESTING.md) |
| PR + branches | [PR-WORKFLOW.md](PR-WORKFLOW.md) |
| Cloud Agent setup | [CLOUD-AGENT.md](CLOUD-AGENT.md) |
| Phone / background prompts | [PROMPT-TEMPLATES.md](PROMPT-TEMPLATES.md) |
