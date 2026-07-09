# CST Badminton Club App

Official app for CST Badminton Training Centre — schedules, registration, attendance, and club operations.

## Quick start

1. Follow **[SETUP.md](./SETUP.md)** for Neon + Clerk + Vercel keys
2. Copy `.env.example` → `.env.local` and fill in values
3. `npm install`
4. `npm run db:push` — create tables on Neon **dev** branch
5. `npm run db:seed` — venues + fleet
6. `npm run dev` — http://localhost:3000

## Stack

Next.js 16 · Clerk · Neon Postgres · Drizzle · Tailwind · Vercel

## Agents & workflow

- **Skill folder:** `.cursor/skills/cst-app-develop/` — context, tests, PR rules, Cloud Agent setup
- **Verify before PR:** `npm run verify`
- **Cloud Agent:** see `.cursor/skills/cst-app-develop/CLOUD-AGENT.md`

## Repo

https://github.com/JEYKOD3/CST-APP
