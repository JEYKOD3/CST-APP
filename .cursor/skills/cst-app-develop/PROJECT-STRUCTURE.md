# Project structure & naming

Agents **must** place new code in the correct folder. Routes stay thin; logic lives in `features/`.

## Repo layout (top level)

```
CST APP/
├── .cursor/           # Agent skills + rules only
├── design/assets/     # Mockups & design refs (NOT served to users)
├── public/            # Static files served at / (logo, manifest, icons)
├── scripts/           # DB seed & one-off maintenance scripts
├── src/               # All application code
├── drizzle.config.ts
├── vitest.config.ts
├── CLAUDE.md          # Product + domain rules
├── SETUP.md           # Env + deploy setup
└── README.md
```

**Never add at repo root:** random `.jpg`, uploads, duplicates, scratch files. Use `public/` or `design/assets/`.

## `src/` layout

```
src/
├── app/                    # Next.js routes ONLY — thin pages & layouts
│   ├── (app)/              # Authenticated app (shared layout + bottom nav)
│   │   ├── dashboard/page.tsx
│   │   ├── schedule/page.tsx
│   │   ├── children/page.tsx
│   │   ├── team/page.tsx
│   │   └── ...
│   ├── api/                # Route handlers (REST/webhooks)
│   ├── sign-in/ sign-up/   # Clerk auth routes
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Public home
│   └── globals.css
├── components/
│   ├── layout/             # App shell: nav, headers
│   └── ui/                 # Reusable primitives (shadcn later)
├── features/               # Domain modules — NEW features go here
│   ├── children/
│   │   ├── actions.ts      # Server actions (mutations)
│   │   ├── queries.ts      # Server-side reads
│   │   └── components/     # Feature-specific UI
│   ├── team/
│   ├── schedule/
│   └── [new-feature]/
├── db/
│   ├── schema.ts           # Drizzle tables
│   └── index.ts            # getDb()
├── lib/                    # Cross-cutting (auth, roles, shared utils)
└── middleware.ts           # Clerk auth gate
```

## Layer rules

| Layer | Location | Contains |
|---|---|---|
| **Route** | `src/app/**/page.tsx` | Compose UI, call queries/actions — **no business logic** |
| **Feature** | `src/features/<name>/` | Actions, queries, feature components |
| **Shared UI** | `src/components/` | Used by 2+ features |
| **Data** | `src/db/` | Schema + client only |
| **Auth/RBAC** | `src/lib/auth.ts`, `src/lib/roles.ts` | Session + role helpers |
| **API** | `src/app/api/` | Webhooks, health, external integrations |

## Naming conventions

| Item | Convention | Example |
|---|---|---|
| Folders | `kebab-case` | `features/schedule/` |
| React components | `PascalCase` file + export | `add-child-form.tsx` → `AddChildForm` |
| Server actions file | `actions.ts` | `features/children/actions.ts` |
| Read/query file | `queries.ts` | `features/schedule/queries.ts` |
| Tests | same name + `.test.ts` | `roles.test.ts` next to `roles.ts` |
| Route segments | `kebab-case` | `/my-children` if added |
| DB tables | `snake_case` in schema | `practice_venues` |
| TypeScript types | `PascalCase` | `AppRole`, `SessionUser` |

## Adding a new feature (checklist)

1. Create `src/features/<feature-name>/`
2. Add `queries.ts` (reads), `actions.ts` (mutations), `components/` (UI)
3. Add thin `src/app/(app)/<route>/page.tsx` that imports from `features/`
4. Add tests: `features/<name>/*.test.ts` or `lib/*.test.ts`
5. Update [CONTEXT.md](CONTEXT.md) one-line map if new top-level area
6. Do **not** create empty folders or duplicate assets

## What NOT to do

- ❌ Server actions buried only in `page.tsx`
- ❌ Business logic in `components/ui/`
- ❌ Binary files at repo root or committed twice
- ❌ New top-level folders without updating this doc
- ❌ `utils.ts` dumping ground — use `features/<name>/` or `lib/`

## Asset rules

| Asset type | Where |
|---|---|
| App logo, PWA icons | `public/` |
| Design mockups | `design/assets/` |
| User uploads (future) | Blob storage — **not** git |

## Token-saving rule

Before creating a file, check this map. Grep `src/features/` for similar patterns. Extend existing feature folder instead of inventing a new layout.
