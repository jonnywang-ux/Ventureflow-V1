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

## Build Progress

> Update this section at the end of each phase before committing. New sessions load this file automatically.

### Phase 1: Project Scaffold — DONE
- `package.json`, `tsconfig.json`, `next.config.ts`, `.env.example`
- `src/app/globals.css` — full design system (CSS vars, fonts, card styles)
- `src/app/layout.tsx`, `src/middleware.ts`
- `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`
- `src/types/index.ts` — Contact, Idea, Action, Note, TeamMember types

### Phase 2: Database — DONE
- `supabase/migrations/001_schema.sql` — all tables with team_id FK
- `supabase/migrations/002_rls_policies.sql` — RLS for all tables
- `supabase/migrations/003_activity_triggers.sql` — auto activity_log
- `supabase/seed.sql` — sample data for KT/DZ/JW

### Phase 3: Auth + Dashboard Shell — DONE
- `src/app/(auth)/login/page.tsx` — magic link login
- `src/app/(dashboard)/layout.tsx` — sidebar nav, getUser() guard
- `src/app/(dashboard)/page.tsx` — dashboard: activity feed + team chips
- UI primitives: Avatar, RegionChip, WarmthBadge, EmptyState

### Phase 4: Pages + Modals + Server Actions — DONE
- `src/app/(dashboard)/contacts/page.tsx` + `actions.ts` (createContact, updateContact)
- `src/app/(dashboard)/ideas/page.tsx` + `actions.ts` (createIdea, voteOnIdea)
- `src/app/(dashboard)/actions/page.tsx` + `actions.ts` (createAction, completeAction)
- `src/app/(dashboard)/notes/page.tsx` + `actions.ts` (createNote)
- Modals: AddContactModal, AddIdeaModal, AddActionModal, AddNoteModal
- Component: VoteBar (toggle +1/-1, fills var(--idea)/var(--china))

### Phase 5: Global Search — DONE
- `src/app/api/search/route.ts` — GET /api/search?q=, queries contacts/ideas/actions/notes, returns SearchResult[]
- `src/components/search/GlobalSearch.tsx` — Ctrl+K overlay, debounced fetch, arrow-key nav, Esc to close
- `src/app/(dashboard)/layout.tsx` — imports GlobalSearch, Ctrl+K hint in nav bar

### Phase 6: Comment Threads — DONE
- `supabase/migrations/004_comments.sql` — activity trigger for comment inserts (SECURITY DEFINER)
- `src/components/comments/CommentThread.tsx` — useOptimistic, useTransition, add/delete comments
- `src/app/(dashboard)/[entity]/[id]/page.tsx` — entity detail page with summary card + CommentThread
- `src/app/(dashboard)/[entity]/[id]/actions.ts` — createComment, deleteComment server actions
- Updated contacts/ideas/actions/notes list pages to link cards to detail pages

### Phase 7: AI Scan Modal — DONE
- `src/app/api/scan/route.ts` — multipart POST, namecard (image→base64→Claude) + notes (text+docx→Claude), Zod validation
- `src/lib/ai/extraction.ts` — nameCardSchema, notesSchema, extractFromNameCard, extractFromNotes, ExtractionError
- `src/lib/ai/prompts.ts` — NAMECARD_SYSTEM_PROMPT, NOTES_SYSTEM_PROMPT (strict JSON, field examples)
- `src/components/scan/ScanModal.tsx` — two-mode UI: image drop zone → editable contact form; textarea+docx → notes preview

### Phase 8: Import Page — DONE
- `src/app/(dashboard)/import/page.tsx` — Server Component, fetches import_history, two-column layout
- `src/app/api/import/route.ts` — POST, parse docx/xlsx, run Claude extraction, record in import_history
- `src/lib/parsers/docxParser.ts`, `xlsxParser.ts` — file parsers
- `src/components/import/ImportUploader.tsx` — Client Component: file drop zone, upload, results preview, save to notes
- `src/components/import/ImportHistory.tsx` — Client Component: list of past imports with status indicators

### Phase 11: CI/CD + Deployment — DONE
- GitHub repo: `jonnywang-ux/Ventureflow-V1` (branch: `main`)
- Vercel project: `ventureflow-v1` — auto-deploys on push to `main`
- Supabase: all 4 migrations applied (001–004), test user `playwright@ventureflow.test` in `team_members`
- GitHub Actions secrets configured: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, PLAYWRIGHT_TEST_EMAIL, PLAYWRIGHT_TEST_PASSWORD
- Vercel env vars set: same set + NEXT_PUBLIC_APP_URL (Vercel domain)
- Build fixes applied: mammoth+xlsx in dependencies, Supabase GenericStringError casts fixed, deprecated npm package warnings resolved

### Phase 10: E2E Tests — DONE
- `playwright.config.ts` — setup + chromium projects, storageState auth, workers:1
- `tests/auth.setup.ts` — logs in via email+password, saves to `tests/.auth/user.json`
- `tests/fixtures/auth.ts` — authenticated page fixture
- `tests/fixtures/data.ts` — test data constants + mock API responses
- `tests/e2e/auth.spec.ts` — login, error state, dashboard stat cards + nav
- `tests/e2e/contacts.spec.ts` — add contact → list + activity feed + Ctrl+K search
- `tests/e2e/ideas.spec.ts` — add idea → vote → count changes
- `tests/e2e/import.spec.ts` — mock /api/import → results → save to Notes → Notes tab
- `tests/e2e/synthesis.spec.ts` — mock /api/synthesis → loading → thesis with ## headings
- data-testid attributes added to all components used by tests

### Phase 9: Synthesis Page — DONE
- `src/lib/ai/synthesis-prompts.ts` — SYNTHESIS_SYSTEM_PROMPT (prose thesis, 500–1500 words, 5 sections)
- `src/lib/ai/synthesis.ts` — SynthesisError, generateSynthesis(teamId): fetches contacts/notes/ideas, calls Claude
- `src/app/api/synthesis/route.ts` — POST /api/synthesis: auth, generateSynthesis, upsert thesis table
- `src/app/(dashboard)/synthesis/page.tsx` — Server Component: fetches thesis, renders viewer + generate button
- `src/components/synthesis/SynthesisViewer.tsx` — Client Component: renders markdown prose, copy button
- `src/components/synthesis/GenerateSynthesisButton.tsx` — Client Component: confirm dialog, loading, router.refresh()

---

## TODO (Next Sessions)

### FEATURE — File Storage + Real-time Import Updates (PRIORITY 1)
- **Goal**: All 3 users' uploaded files stored in Supabase Storage; all users see new imports live
- **Steps**:
  1. Create `imports` bucket in Supabase Storage (private)
  2. New migration: add `file_path TEXT` column to `import_history`
  3. Update `src/app/api/import/route.ts` — upload file buffer to Storage bucket under `{team_id}/{filename}`
  4. Update `src/components/import/ImportHistory.tsx` — add Supabase Realtime subscription on `import_history` filtered by `team_id`

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
