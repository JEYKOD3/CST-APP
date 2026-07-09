# CST App — Account setup (before / during Sprint 1)

## 1. Neon — DATABASE_URL

1. Open [console.neon.tech](https://console.neon.tech) → project **cst-app**
2. Left sidebar → **Branches**
3. Click branch **`dev`** (for local + Vercel preview)
4. Click **Connection string** → copy **Pooled connection** (recommended)
5. Paste into:
   - Local: `.env.local` as `DATABASE_URL=...`
   - Vercel: Project → Settings → Environment Variables → **Preview** + **Development**

Use branch **`main`** connection string only for **Production** on Vercel later.

---

## 2. Clerk — API keys (step by step)

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. **Create application** (if you haven't):
   - Name: `CST Badminton Club`
   - Sign-in options: enable **Email** (password or email code — pick one)
3. In the left menu, click **Configure** → **API Keys**  
   (Or: home → your app → **API keys** in the sidebar)
4. Copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY` (click "Show" first)
5. Add both to `.env.local` and to **Vercel** env vars (Preview + Production)

### After first Vercel deploy

1. Clerk → **Configure** → **Paths** (or **Domains**)
2. Add your Vercel URLs under allowed redirects, e.g.:
   - `https://your-app.vercel.app`
   - `https://*.vercel.app` (preview deployments)

---

## 3. Vercel — connect GitHub

1. [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import **JEYKOD3/CST-APP**
3. Framework: **Next.js** (auto)
4. Add environment variables (from sections 1–2) before first deploy
5. Deploy → copy **Preview URL** → test on your phone

---

## 4. Cursor Cloud Agent

1. Cursor → **Settings** → **Billing** → spending limit **$20**
2. Connect **GitHub** → allow **CST-APP** repo
3. Enable **Cloud Agents**
4. Dispatch Sprint 1 or push to `sprint-1-foundation` branch

---

## 5. Quick test checklist

- [ ] `npm run dev` → http://localhost:3000 loads
- [ ] Sign up / sign in works (Clerk)
- [ ] No errors in terminal about `DATABASE_URL`
- [ ] Vercel preview opens on phone
- [ ] Logo shows on home page

---

## Staff emails (seed after login works)

| Role | Email |
|---|---|
| Super admin + coach | ghaidaghaniyu.cstbrossard@gmail.com |
| Super admin (CEO) | m.h.vakili@gmail.com |
| Coach | jeanyao5787@gmail.com |

Assign roles in Clerk → Users → Public metadata, or via in-app Team settings (Sprint 2).
