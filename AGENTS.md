<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next.js 16, React 19, Tailwind v4) has breaking changes. In the App Router,
`params`/`searchParams` are Promises; Tailwind v4 uses CSS-first config. Read
`node_modules/next/dist/docs/` before assuming older conventions.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Repository Expectations
- Read `docs/project-brief.md` and `docs/tasks.md` before making changes.
- Keep changes small and focused.
- Run lint/build checks when available (`npm run lint`, `npm run build`).
- Update `docs/tasks.md` after completing review or implementation work.

## Codex Role
Codex acts as the **code review and project management agent**. Codex is run by the Owner
in the Codex desktop app, pointed at this repo (or the latest Git diff). Codex does not call
Claude Code automatically — handoff happens through Git commits and the files in `docs/`.

## Review Checklist
- MVP scope control (did the project become too complex?)
- TypeScript safety (no `any` abuse, sound types)
- Component clarity (beginner-friendly structure)
- No unnecessary dependency
- Responsive layout
- Empty / loading / error states present
- Accessibility basics (labels, focus, contrast)
- README accuracy

## What Codex Should Do
1. Review the current repo / latest diff against `docs/project-brief.md` and `docs/tasks.md`.
2. Produce or update `docs/codex-review.md` with small, actionable comments.
3. Update `docs/tasks.md` with Next Actions and Risks.

## What Codex Should NOT Do
- Do not redesign the whole UI.
- Do not overwrite Claude Code's full implementation.
- Do not introduce large dependencies without confirmation.
- If making code changes, keep them minimal and explain them clearly.

## Handoff Protocol
Claude Code implements features → Owner commits each phase → Owner runs Codex review →
Codex writes `docs/codex-review.md` → Owner decides which fixes to apply → Claude Code
applies approved fixes before the next phase.
