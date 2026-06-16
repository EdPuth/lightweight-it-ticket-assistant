<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next.js 16, React 19, Tailwind v4) has breaking changes — APIs, conventions,
and file structure may differ from your training data. Notably:
- In the App Router, `params` and `searchParams` are **Promises** and must be `await`ed.
- Tailwind v4 uses CSS-first config (`@import "tailwindcss"` + `@theme`), no `tailwind.config.js`.

Read the relevant guide in `node_modules/next/dist/docs/` before writing code that touches
these areas. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CLAUDE.md

## Role
Claude Code is the **frontend design and implementation agent**.

## Project Goal
Build a lightweight IT Support Ticket Assistant MVP for practice (mock data only).

## Rules
- Start with planning before coding.
- Keep the MVP small and beginner-friendly.
- Prefer simple components over complex abstractions.
- Use mock data before any real backend integration.
- Update `docs/tasks.md` after each phase.
- Do not introduce new dependencies without explaining why (write the reason in `docs/decisions.md`).
- Do not change more than one feature area per phase.
- If `lint`/`build` fails, fix it before continuing with new features.
- Make code easy for Codex to review.

## Workflow (per phase)
1. Read `README.md`, `docs/project-brief.md`, `docs/tasks.md` first.
2. Write a small plan (which files will change).
3. Implement that one phase only.
4. Run `npm run lint` and `npm run build`.
5. Update `docs/tasks.md` (Completed / Next / Risks).

## Required Output After Each Phase
- Summary of completed work
- Files changed
- How to run/test
- Known issues
- Suggested Codex review focus

## Scope Boundaries (do NOT build in MVP)
Real email sync, attachments, auth/roles, approval flows, real LLM API, server-side
pagination, complex BI charts. These belong to "future directions" only.
