# When to ask the user (stop coding)

Ask **before implementing** when any of these apply:

## Always ask

- Payment amounts, e-transfer rules, auto-approve logic
- Breaking DB schema changes (column drops, renames)
- Production deploy or Neon **main** branch cutover
- New third-party services (Stripe, SMS, email provider)
- Who can see what for a **new** role permission

## Ask if unclear

- Which sprint item to prioritize
- UI copy in French/Chinese vs English only
- Teen self-managed login flow details
- Private lesson pricing / scheduling rules
- Court rental windows and pricing tiers

## Do not ask (decide from project files)

- Stack choice (Next/Clerk/Neon — already decided)
- Mobile-first layout
- Role names and modifiable team pattern
- Player levels enum
- Running lint/test/build before PR

## Question format (save tokens)

Use numbered questions with **recommended default**:

```
1. [Question]? (Recommended: A — reason)
   A) ...
   B) ...
```

User can reply `1A` on phone for fast answers.
