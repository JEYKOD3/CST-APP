# Cursor Cloud Agent — configuration (no code)

Use this to run CST features **in the background** from desktop or phone while you approve PRs on GitHub.

## One-time setup

### 1. Billing & limits

1. Cursor → **Settings** → **Billing**
2. Set spending limit (**$20** recommended cap)
3. Enable usage you’re comfortable with for Cloud Agents

### 2. GitHub access

1. Cursor → **Settings** → **GitHub** → connect account
2. Grant access to **`JEYKOD3/CST-APP`**
3. Confirm the repo appears in Cloud Agent repo picker

### 3. Vercel (already done)

- Project linked to `CST-APP`
- Env vars: `DATABASE_URL` (dev), Clerk keys — Preview + Development
- Production uses Neon **main** only when you go live

### 4. Neon

- **dev** branch → preview/local
- **main** branch → production later

## Starting a Cloud Agent run

### From desktop

1. Open **CST APP** workspace in Cursor
2. **Agents** → **Cloud** (or dispatch from chat)
3. Pick branch: `sprint-1-foundation` or new `sprint-2-*` branch
4. Paste a prompt from [PROMPT-TEMPLATES.md](PROMPT-TEMPLATES.md)

### From phone (Cursor mobile)

1. Open the **CST-APP** repo / project
2. New agent message with the **standard header** (below)
3. Agent runs in cloud; you get notified when PR is ready

### Standard prompt header (paste every time)

```
CST Badminton Club app. Follow .cursor/skills/cst-app-develop/SKILL.md exactly.
Read SPRINT-STATUS.md and CONTEXT.md first. Run verify.sh before PR.
Repo: JEYKOD3/CST-APP. Mobile-first. Ask before payment/schema/production changes.

Task: [YOUR TASK HERE]
```

## What the agent must do every run

1. Read skill + sprint status (not full repo scan)
2. Implement on a feature branch
3. Add tests + run `npm run verify`
4. Open PR — **you approve on GitHub**
5. Test Vercel preview on your phone

## Background / async behavior

- Cloud Agent keeps working after you close the chat
- You receive completion + PR link
- If blocked, agent should leave **questions in PR description** or as GitHub comment — answer on phone, re-dispatch

## Cost control tips

| Do | Don't |
|---|---|
| One focused task per agent run | "Build entire Sprint 2" in one prompt |
| Point to specific files in prompt | "Explore the whole codebase" |
| Use skill templates | Repeat full product spec each time |
| Approve PRs incrementally | Let branches grow for weeks |

## Clerk after preview deploy

When Vercel gives a new preview domain:

1. Clerk Dashboard → **Configure** → **Domains**
2. Add `https://*.vercel.app` and your stable preview URL
3. Re-test sign-in on phone

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails on Vercel | Check PR checks log; usually missing env var |
| Sign-in fails on preview | Add Vercel URL to Clerk domains |
| DB errors on preview | Confirm `DATABASE_URL` is Neon **dev** pooled string |
| Agent didn't open PR | Re-run with "finish PR per PR-WORKFLOW.md" |
