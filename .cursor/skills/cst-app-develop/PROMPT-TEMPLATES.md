# Prompt templates (copy-paste)

Replace `[TASK]` and send to Cursor desktop, phone, or Cloud Agent.

## Standard feature

```
CST Badminton Club app. Follow .cursor/skills/cst-app-develop/SKILL.md exactly.
Read SPRINT-STATUS.md and CONTEXT.md first. Run verify.sh before PR.
Repo: JEYKOD3/CST-APP. Branch from sprint-1-foundation or create sprint-2-registration.

Task: [TASK]

Deliver: code + tests + PR. Test plan in PR body. Vercel preview must pass.
```

## Sprint 2 kickoff example

```
CST Badminton Club app. Follow .cursor/skills/cst-app-develop/SKILL.md exactly.
Read SPRINT-STATUS.md and CONTEXT.md first.

Task: Start Sprint 2 — summer registration form (parent flow), e-transfer proof upload placeholder, admin payment queue list. Mobile-first UI matching existing CST green/dark theme. Add tests. Open PR to main.

Ask me before payment auto-approve rules.
```

## Fix failing build

```
CST Badminton Club app. Follow SKILL.md. PR [URL] has failing Vercel check.

Read the CI log, fix root cause, run verify.sh, push to same branch. Do not expand scope.
```

## Continue after your answer

```
CST Badminton Club app. Follow SKILL.md. You asked: [paste question]. Answer: [your answer].

Continue implementation, run verify.sh, update PR.
```
