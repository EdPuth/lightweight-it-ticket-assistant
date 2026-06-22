# Lightweight IT Support Ticket Assistant

A lightweight, beginner-friendly **IT support ticket management web app**. It mimics how a
small company's internal IT support team handles employee requests, and is a practice
project for frontend pages, data modeling, state management, a mock AI reply, and a
two-agent development workflow.

> Practice project: Supabase persistence is enabled and the app is gated behind a single
> shared login, but there is **no per-user auth / RLS** and **no real AI API**. Do not use
> real employee/customer data in the public demo.

## Features (implemented)

- **Sign in** (`/login`) — the whole app is gated behind a single shared account
  (`itsupport@outlook.com` / `123456`). Credentials are checked server-side; a successful
  login sets an httpOnly session cookie and `src/proxy.ts` redirects unauthenticated
  visitors to `/login`. Sign out clears the session.
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

- **Single shared login, not real auth** — one hardcoded account gates the app, but there
  are no per-user accounts, roles, or Supabase RLS policies; DB writes still use the
  service-role key. Real production auth = Supabase Auth + RLS + anon key (future direction).
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
cp .env.example .env.local   # then fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm run dev      # http://localhost:3000
npm run lint     # lint check
npm run build    # production build (the gate before each commit)
```

## Deployment

Deployed on Vercel (imports this GitHub repo). Set `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` as Vercel environment variables (no `NEXT_PUBLIC_`
prefix). See `docs/db-setup.md`. The app is gated behind a single shared login;
**production requires `AUTH_SESSION_TOKEN`** (a long random string) or it will
refuse to start — the dev fallback token is public in the source. You may also
override `AUTH_EMAIL` / `AUTH_PASSWORD`. This is a practice gate, not per-user
auth — fine for a demo, not for real data.

> Upgrading an existing database: run `supabase/migration-2026-06-21-add-closed-status.sql`
> in the Supabase SQL Editor once so the `closed` status is allowed (re-running the full
> `schema.sql` would drop your data).

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
