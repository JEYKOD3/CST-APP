# Testing standards

## Required for every feature

1. **Unit tests** for `src/lib/*` and pure server logic
2. **Integration tests** when adding server actions or API routes (Vitest + mocks)
3. **Manual checklist** in PR body for UI flows Clerk/DB need

## Commands

```bash
npm run test        # watch mode (local)
npm run test:run    # CI / agent — must pass
npm run verify      # lint + test + build (full gate)
```

Or: `.cursor/skills/cst-app-develop/scripts/verify.sh`

## Where to put tests

| Code | Test file |
|---|---|
| `src/lib/foo.ts` | `src/lib/foo.test.ts` |
| `src/features/bar/actions.ts` | `src/features/bar/actions.test.ts` |
| Server action | `src/features/<name>/actions.test.ts` |
| API route | `src/app/api/.../route.test.ts` |

## What to test

- Role helpers (`canManageTeam`, `isStaffRole`, …)
- Auth guards (who can call an action)
- Form validation (missing fields, bad enums)
- DB queries return expected shape (mock `getDb` when needed)

## What not to test (v1)

- Clerk UI components (trust Clerk)
- Full E2E browser flows (add Playwright later if needed)

## PR test section template

```markdown
## Test plan
- [ ] `npm run verify` passes
- [ ] Signed in as parent → [flow]
- [ ] Signed in as super_admin → [flow]
- [ ] Vercel preview URL tested on phone
```
