# Lightweight IT Support Ticket Assistant

A lightweight, beginner-friendly **IT support ticket management web app**. It mimics how a
small company's internal IT support team handles employee requests, and is a practice
project for frontend pages, data modeling, state management, a mock AI reply, and a
two-agent development workflow.

> Practice project: Supabase persistence is enabled and the app is gated behind a single
> shared login, but there is **no per-user auth / RLS** and **no real AI API**. Do not use
> real employee/customer data in the public demo.

## Features (implemented)

- **Sign in + roles (RBAC)** (`/login`) — multi-account auth via **Supabase Auth**. Three
  fixed roles: **employee** (create + view only their own tickets), **it_support** (view and
  process all tickets, no delete), **admin** (everything, incl. delete). `src/proxy.ts` gates
  the app behind a session; roles are enforced in Server Actions / Server Components (not just
  hidden in the UI). Test accounts are created by `scripts/seed-users.ts`.
- **Dashboard** (`/`) — status stat cards (Open / In Progress / Waiting / Resolved / Closed)
  that double as a status filter, plus search and a priority filter over a sorted ticket list.
  By default the list shows **active tickets only** (Open / In Progress / Waiting); Resolved
  and Closed tickets are hidden until you click their status card.
- **Ticket detail** (`/tickets/[id]`) — full ticket view, requester metadata, description,
  activity timeline, **change status** (incl. Closed), **assign a technician**, **add an
  internal note**, and **delete the ticket** (confirm-gated danger action; activities cascade).
  Invalid ids show a friendly "ticket not found" state.
- **Create ticket** (`/tickets/new`) — controlled form (requester, email, title, category,
  priority, description) with inline validation; successful submissions are persisted to
  Supabase and redirect to the new ticket detail page.
- **AI suggested reply** (mock) — on the detail page, generates a draft reply from a local
  solution-template library (no real LLM). Copy it or insert it into the timeline as a
  reply. Clearly labelled "Suggested draft — review before sending".

## Data & persistence

Tickets are stored in a **Supabase (PostgreSQL)** database (see `docs/db-setup.md`). Creating a
ticket, changing status, assigning a technician, adding notes, and inserting an AI reply are all
**persisted** and survive a page refresh. Reads happen in Server Components; writes go through
Server Actions using a server-only service-role key.

Still mock / out of scope:

- **No database-level RLS yet** — RBAC is enforced in the app layer (role checks in every
  Server Action / Server Component) while data access still uses the service-role key. Adding
  Supabase RLS policies is the planned tightly-coupled follow-up.
- **No self-service signup** — v1 uses 3 seeded accounts; there's no registration, invite,
  or password-reset flow.
- **AI replies** are generated from **local templates** (`src/lib/reply-templates.ts`), not a
  real language model.

## Tech stack

- Next.js 16 (App Router, Server Components + Server Actions) + TypeScript
- React 19
- Tailwind CSS v4 + custom components (no UI library)
- Supabase (PostgreSQL) for storage; `src/lib/mock-tickets.ts` is the seed source
- Client filtering/search with `useState` / `useMemo`

## Run locally

Requires a Supabase project and a `.env.local` — see `docs/db-setup.md`.

```bash
npm install      # first time (already installed by the scaffold)
cp .env.example .env.local   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
npm run dev      # http://localhost:3000
npm run lint     # lint check
npm run build    # production build (the gate before each commit)
```

First-time RBAC setup (or when upgrading an existing DB):

```bash
# 1. In the Supabase SQL Editor, run the RBAC migration once:
#    supabase/migration-2026-06-23-rbac.sql   (profiles + tickets.requester_user_id)
# 2. Create the 3 test accounts + backfill ownerless tickets:
node --env-file=.env.local scripts/seed-users.ts
```

Seeded test accounts (password = first name + `123`): `admin@example.com`,
`support@example.com`, and three employees `tom@example.com`, `jerry@example.com`,
`mia@example.com`. The seed script round-robins existing tickets across the three
employees so each only sees their own (employee isolation demo).

## Deployment

Deployed on Vercel (imports this GitHub repo). Set `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` as Vercel environment
variables (no `NEXT_PUBLIC_` prefix). See `docs/db-setup.md`. Make sure Email
auth is enabled in Supabase, the RBAC migration has been run, and the seed
script has created the accounts. RBAC is enforced in the app layer; database RLS
policies are a planned follow-up, so this is still a demo, not for real data.

> Earlier `closed`-status migration (if not already applied):
> `supabase/migration-2026-06-21-add-closed-status.sql`.

## Project structure

```
├─ CLAUDE.md            # Claude Code (frontend agent) role & rules
├─ AGENTS.md            # Codex (review / PM agent) role & checklist
├─ docs/
│  ├─ project-brief.md  # MVP scope + data model
│  ├─ frontend-spec.md  # page & feature spec
│  ├─ tasks.md          # phase checklist: Completed / Next / Risks
│  ├─ decisions.md      # decision log
│  ├─ codex-review.md   # Codex's review output
│  └─ prompts/          # reusable prompts for the two agents
└─ src/
   ├─ app/              # pages (/, /tickets/[id], /tickets/new)
   ├─ components/       # UI components
   └─ lib/              # types, mock data, utilities, reply templates
```

## Multi-agent workflow

- **Claude Code** handles frontend design and implementation.
- **Codex** handles code review and project management.
- The two agents do not call each other; they hand off through Git + the `docs/` files.
  See `AGENTS.md` and `docs/tasks.md`.

## Future directions (post-MVP)

Auth & roles, Row Level Security policies using the anon key, a real AI API, keyword search
over past tickets, and an email-issue knowledge base. The AI reply's
`src/lib/reply-templates.ts` is already structured as a seed for the last two — see decision
D8 in `docs/decisions.md`.
