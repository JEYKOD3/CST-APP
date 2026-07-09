# PR workflow (mandatory)

Every feature ends with a **Pull Request** — user approves on GitHub mobile → Vercel preview deploys.

## Branch rules

| Rule | Value |
|---|---|
| Base branch | `main` |
| Feature branches | `sprint-N-short-name` or `feature/short-name` |
| Never | force push, commit secrets, merge without user approval |

## Agent steps (end of every task)

```bash
git checkout -b sprint-N-feature-name   # or stay on current sprint branch
git add <relevant files>
git commit -m "$(cat <<'EOF'
Short why-focused message.

EOF
)"
git push -u origin HEAD
gh pr create --title "..." --body "$(cat <<'EOF'
## Summary
- ...

## Test plan
- [ ] npm run verify
- [ ] ...

EOF
)"
```

Return the **PR URL** to the user.

## Vercel (automatic)

- PR opened → Vercel builds **Preview** deployment
- User opens preview URL on phone to test
- After merge to `main` → Production deploy (when prod env vars ready)

## Env per environment

| Vercel env | DATABASE_URL branch |
|---|---|
| Preview + Development | Neon **dev** |
| Production | Neon **main** (only when user approves go-live)

## User approval flow (phone)

1. GitHub notification → review PR diff
2. Open Vercel preview link from PR checks
3. Approve + merge when satisfied
4. Test again on merged preview/production URL
