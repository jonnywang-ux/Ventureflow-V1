# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VentureFlow** — AI Venture Intelligence Hub for a 3-person team (KT, DZ, JW) tracking contacts, ideas, actions, and field notes across China & USA AI markets.

**Stack:** Next.js 15 (App Router), TypeScript, Supabase (auth + DB), Anthropic Claude API (AI extraction), Tailwind CSS, Playwright (E2E)

**Architecture:** Server Components by default. Client Components only for interactivity (search overlay, vote toggle, comment threads). Server Actions for all mutations. No Stripe/billing.

**Reference:** `Reference page.html` — complete localStorage-based UI prototype. Match its visual design exactly.

## Critical Rules

### Database

- All tables have a `team_id` FK and RLS policy: `team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())`
- Migrations in `supabase/migrations/` — never modify the database directly
- Use `select()` with explicit column lists, not `select('*')`
- All user-facing queries must include `.limit()` to prevent unbounded results

### Authentication

- Use `createServerClient()` from `@supabase/ssr` in Server Components
- Use `createBrowserClient()` from `@supabase/ssr` in Client Components
- Protected routes check `getUser()` — never trust `getSession()` alone
- Middleware in `middleware.ts` refreshes auth tokens on every request
- Team membership: `team_members(id, team_id, user_id, initials, color)` — 3 members: KT=#c94040, DZ=#2a5ca8, JW=#2a7a4a

### Code Style

- No emojis in code or comments
- Immutable patterns only — spread operator, never mutate
- Server Components: no `'use client'` directive, no `useState`/`useEffect`
- Client Components: `'use client'` at top, minimal — extract logic to hooks
- Zod schemas for all input validation (server actions, API routes)
- TypeScript strict mode throughout

### Design System

CSS variables defined in `globals.css`:
- `--bg:#f5f2ec`, `--bg2:#ede9e0`, `--surface:#fff`, `--border:#ddd9d0`
- `--ink:#1a1814`, `--ink2:#4a4640`, `--ink3:#8a857d`, `--ink4:#b8b3ab`
- `--china:#c94040`, `--usa:#2a5ca8`, `--idea:#2a7a4a`, `--action:#7a4a2a`, `--gold:#b8960a`
- `--radius:10px`
- Fonts: Geist Mono 300 (body), Syne 600–800 (headings), Instrument Serif 400 (large stats)

## File Structure

```
src/
  app/
    (auth)/          # Login page
    (dashboard)/     # Protected pages: dashboard, contacts, ideas, actions, notes, synthesis, import
      layout.tsx     # Checks getUser(), redirects to /login if unauthenticated
    api/
      search/        # Full-text search endpoint
      scan/          # Claude AI extraction (name cards, notes)
  components/
    ui/              # Card, Button, Modal, FilterChip, Badge, SearchInput, Avatar, ProgressBar
    comments/        # CommentThread (polymorphic: contact|idea|action|note)
    search/          # GlobalSearch overlay (Ctrl+K)
    scan/            # ScanModal (name card + notes AI extraction)
  hooks/             # useTeam, useCurrentMember
  lib/
    supabase/        # server.ts (createServerClient), client.ts (createBrowserClient)
    ai/              # claude.ts, extraction.ts, prompts.ts
  types/             # Shared TypeScript types
supabase/
  migrations/        # 001_schema.sql, 002_rls_policies.sql, 003_activity_triggers.sql
  seed.sql           # Sample data (5–10 rows per table)
```

## Key Patterns

### Server Action Pattern

```typescript
'use server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const schema = z.object({ name: z.string().min(1).max(100) })

export async function createContact(formData: FormData) {
  const parsed = schema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { success: false, error: parsed.error.flatten() }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('contacts')
    .insert({ name: parsed.data.name, team_id: '...', added_by: user.id })
    .select('id, name, created_at')
    .single()

  if (error) return { success: false, error: 'Failed to create contact' }
  return { success: true, data }
}
```

### RLS Policy Pattern

```sql
CREATE POLICY "team_access" ON contacts
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );
```

### AI Extraction (Claude API)

- API route `app/api/scan/route.ts` receives multipart form data
- Sends to `claude-sonnet-4-6` — never expose `ANTHROPIC_API_KEY` to client
- Returns structured JSON validated with Zod before writing to DB

### Document Parsing (Server-Side)

- `import('mammoth')` for .docx extraction (dynamic import, server-only)
- `import('xlsx')` for .xlsx extraction (dynamic import, server-only)
- Both packages are in `dependencies` (not devDependencies) — required for Vercel build

### Supabase Dynamic Table Queries

When calling `.from(dynamicString)` with a runtime variable (not a string literal), TypeScript
infers `GenericStringError` in the return type. Always cast through `unknown` first:

```typescript
// CORRECT — cast through unknown when table name is a variable
const entity = data as unknown as Contact

// WRONG — direct cast rejected by TypeScript strict mode
const entity = data as Contact
```

## Database Tables

`contacts`, `ideas`, `idea_votes` (unique per user+idea), `actions`, `notes`, `comments` (polymorphic via `entity_type`+`entity_id`), `activity_log`, `thesis` (unique per team), `import_history`

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # Server-only, never expose to client
ANTHROPIC_API_KEY=             # Server-only, never expose to client
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Commands

```bash
npm run dev            # Start dev server
npm run build          # Production build
npx supabase db push   # Apply migrations
npx playwright test    # Run E2E tests
```

## Testing Strategy

```bash
/tdd                    # Unit + integration tests for new features
/e2e                    # Playwright tests for auth, CRUD, search, import
/test-coverage          # Verify 80%+ coverage
```

Critical E2E flows:
1. Sign up → login → dashboard renders with seed data
2. Add contact → appears in list + activity feed + Ctrl+K search
3. Log idea → vote → vote count increments, member avatar fills
4. Import .docx → extracted text → save as Note → appears in Notes tab
5. Scan business card image → Claude extracts data → pre-fills Add Contact form

## Git Workflow

- Code stored on GitHub, deployed to Vercel
- `feat:` new features, `fix:` bug fixes, `refactor:` code changes
- Feature branches from `main`, PRs required
- Vercel preview on PR, production on merge to `main`

## Status

All features shipped. Project is in maintenance mode — bug fixes and improvements only.

**What's built:** auth (magic link), dashboard, contacts, ideas, actions, notes, global search (Ctrl+K), comment threads, AI scan modal (name cards + notes), import page (docx/xlsx/pdf/md), synthesis page (AI thesis), file storage, realtime import history, CI/CD + Vercel deploy, E2E tests.

**Infrastructure:** GitHub `jonnywang-ux/Ventureflow-V1` → Vercel `ventureflow-v1` (auto-deploy on push). Supabase migrations 001–006 applied.

---

## Known Issues / Improvements

_Add bugs and improvements here as they are found. Remove when fixed._

---

## ECC Skills for This Project

```bash
/everything-claude-code:frontend-patterns    # UI pages and components
/everything-claude-code:backend-patterns     # Server actions, API routes
/everything-claude-code:database-migrations  # Supabase migrations, RLS
/everything-claude-code:security-review      # Auth and RLS audit
/everything-claude-code:claude-api           # Anthropic SDK integration
/everything-claude-code:e2e-testing          # Playwright tests
/everything-claude-code:deployment-patterns  # Vercel config
```
