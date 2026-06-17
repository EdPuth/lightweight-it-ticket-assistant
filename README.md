# Lightweight IT Support Ticket Assistant

A lightweight, beginner-friendly **IT support ticket management web app**. It mimics how a
small company's internal IT support team handles employee requests, and is a practice
project for frontend pages, data modeling, state management, a mock AI reply, and a
two-agent development workflow.

> Practice project: **no backend, no database, no real AI API** — everything runs on mock
> data in the browser.

## Features (implemented)

- **Dashboard** (`/`) — status stat cards (Open / In Progress / Waiting / Resolved) that
  double as a status filter, plus search and a priority filter over a sorted ticket list.
- **Ticket detail** (`/tickets/[id]`) — full ticket view, requester metadata, description,
  activity timeline, **change status**, **assign a technician**, and **add an internal
  note**. Invalid ids show a friendly "ticket not found" state.
- **Create ticket** (`/tickets/new`) — controlled form (requester, email, title, category,
  priority, description) with inline validation and a mock success state.
- **AI suggested reply** (mock) — on the detail page, generates a draft reply from a local
  solution-template library (no real LLM). Copy it or insert it into the timeline as a
  reply. Clearly labelled "Suggested draft — review before sending".

## Mock limitations (by design)

This MVP has **no persistence**. Specifically:

- Submitting the create form does **not** save the ticket — it shows a success state but the
  ticket does **not** appear in the list.
- Changing status, assigning a technician, adding notes, or inserting an AI reply update
  **in-memory state only** and **reset on page refresh**.
- AI replies are generated from **local templates**, not a real language model.

## Tech stack

- Next.js 16 (App Router) + TypeScript
- React 19
- Tailwind CSS v4 + custom components (no UI library)
- React `useState` / `useMemo` for state
- Mock data in `src/lib/mock-tickets.ts`

## Run locally

```bash
npm install      # first time (already installed by the scaffold)
npm run dev      # http://localhost:3000
npm run lint     # lint check
npm run build    # production build (the gate before each commit)
```

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

## Future directions (not in this MVP)

Real persistence (Supabase / Firebase), auth & roles, a real AI API, deployment to Vercel,
keyword search over past tickets, and an email-issue knowledge base. The AI reply's
`src/lib/reply-templates.ts` is already structured as a seed for the last two — see decision
D8 in `docs/decisions.md`.
