# Codex Review

> 本文件由 **Codex**（review / 项目管理 agent）维护。Claude Code 不在此写内容。
> Owner 在 Codex 桌面 App 中，使用 `docs/prompts/codex-review-prompt.md` 触发 review。

---

## 使用方式
1. Claude Code 完成一个阶段并 commit 后，Owner 打开 Codex 桌面 App，指向本仓库（或最新 diff）。
2. 粘贴 `docs/prompts/codex-review-prompt.md` 的内容作为 prompt。
3. Codex 在下方按阶段追加 review 记录，并更新 `docs/tasks.md` 的 Next / Risks。

---

## Review Log

### MVP Phases 0-6 — Compressed Review Summary
- 状态：✅ Completed and reviewed by Codex across 2026-06-16 to 2026-06-17

#### What Was Built
- Project scaffold and docs: Next.js 16 / React 19 / Tailwind v4, `AGENTS.md`, `CLAUDE.md`, project brief, tasks, decisions, prompts, and review workflow.
- Data layer: typed ticket/activity models, mock tickets, pure utilities for filtering/search/sort/count/date formatting, and centralized labels/order/color maps.
- Dashboard: Typora-style UI, status stat cards as filters, priority filter, search, ticket cards/list, empty states, responsive polish, and reduced-motion-aware animations.
- Ticket detail: `/tickets/[id]`, friendly not-found state, metadata, description, timeline, status changes, notes, assignee selection, and semantic cleanup.
- Create ticket: `/tickets/new`, accessible controlled form validation, error states, and later DB-backed submit flow.
- Mock AI suggested reply: local solution-template library, idle/loading/generated UI, editable draft, copy failure feedback, insert-as-reply, and tightened keyword matching.
- Final MVP polish: English UI, README updates, no broad UI redesign, no real AI API, no unnecessary dependencies.

#### Resolved Phase 0-6 Review Items
- Starter page/metadata replaced.
- Detail and create routes implemented after earlier placeholder links.
- Mock timeline gaps cleaned up.
- Create mock id collision and metadata `<dl>` issues fixed.
- Duplicate Clear filters action removed.
- AI template false positives fixed.
- Clipboard failure now shows visible feedback.

#### Current Relevance
- Historical Phase 0-6 details are intentionally compressed to keep this handoff readable.
- For current work, prioritize the Database Extension and Hardening/Login Gate review sections below.

### Database Extension — Supabase + Vercel
- 状态：✅ Reviewed by Codex on 2026-06-20

#### Summary
- The Supabase migration is coherent and beginner-friendly: DB access is isolated in `tickets-repo.ts`, pages read through Server Components, and writes go through Server Actions.
- The service-role key is only referenced server-side and is not exposed with a `NEXT_PUBLIC_` prefix.
- Schema basics are solid for this scale: check constraints are present, `activities.ticket_id` has an index, and RLS is enabled with no public policies.
- Vercel/Supabase deployment is now beyond the original MVP, so the main remaining concern is scope and security posture rather than component structure.

#### Verification
- `npm run lint` ✅
- `npm run build` ✅ after allowing network for `next/font` Google Fonts
- Source scan reviewed Supabase env usage, server-only client usage, Server Actions, SQL schema, seed/docs, and obvious client storage/API leaks ✅
- Read-only localhost smoke test ✅
  - `/` returned 200 and rendered DB-backed ticket data
  - `/tickets/TKT-1001` returned 200
  - `/tickets/new` returned 200

#### Findings
- **P2 — Public deployment has persistent unauthenticated writes.** This is documented as a practice/demo limitation, but it is now materially different from the earlier mock-only MVP: anyone who can open the Vercel URL can create tickets, change status, assign technicians, and add notes/replies. Do not put real data in this Supabase project. If the app remains publicly deployed, the next real scope should be Supabase Auth + RLS policies + anon-key access.
- **P2 — Server Actions trust client-side validation and client-provided transition metadata.** `src/app/actions.ts` accepts typed values, but Server Actions are public endpoints at runtime. A direct caller can bypass the create form's validation, send very large strings, or pass misleading `prev` values to `changeStatusAction`, producing inaccurate activity text. Add shared server-side validators for create/status/assignee/note/reply inputs before treating this as more than a demo.
- **P3 — `insertActivity()` ignores the result of the ticket `updated_at` update.** In `src/lib/tickets-repo.ts`, the activity insert checks errors, but the follow-up `tickets.update({ updated_at })` is awaited without inspecting `{ error }`. If that update fails, the user sees the activity but sorting/freshness metadata can silently become stale.
- **P3 — Dashboard sends full ticket objects to the client.** `listTickets()` returns every ticket with description, requester email, and activities, then `DashboardClient` receives that whole array. Fine for a practice app with public data, but if auth/real data is added, create a lighter list DTO for dashboard rows.
- **P3 — README had stale mock-only wording.** It still said "no backend, no database" and listed persistence/deployment as future work. I updated README during this review to reflect Supabase persistence and Vercel deployment.

#### High-Priority Issues
- None blocking the practice project.
- Security note: the no-auth public write model becomes high priority if the URL is shared broadly or any real/private data is entered.

#### Scope / Architecture Notes
- Keep the current service-role approach only for this practice/demo phase.
- Do not add a large auth abstraction yet. The clean next step is narrow: Supabase Auth, RLS policies, and moving browser-safe reads/writes to the anon key where appropriate.
- Avoid jumping straight into a real AI API before the data access/security model is tightened.

#### Next Actions For Claude Code
1. Add runtime validation inside all Server Actions, reusing the existing union constants/labels where possible and keeping it dependency-free unless the owner approves a small validator like Zod.
2. Check and throw on the `updated_at` update error in `insertActivity()`.
3. If continuing toward production-like behavior, plan a separate Auth/RLS phase before keyword search or real AI.

### Hardening + Login Gate — Single-Account Auth
- 状态：✅ Reviewed by Codex on 2026-06-21

#### Summary
- The DB review follow-ups are mostly addressed: Server Actions now have dependency-free runtime validation, and `insertActivity()` checks the follow-up `updated_at` update error.
- The new login gate works in the normal browser flow: unauthenticated users are redirected to `/login`, bad credentials show an alert, good credentials reach the Dashboard, and Sign out returns to `/login`.
- The login feature is correctly documented as practice-grade, not production auth.

#### Verification
- `npm run lint` ✅
- `npm run build` ✅
- Browser smoke test on `http://localhost:3000` ✅
  - Unauthenticated `/` redirects to `/login`
  - Bad credentials stay on `/login` and show `Incorrect email or password.`
  - `itsupport@outlook.com` / `123456` signs in and renders the Dashboard
  - `Sign out` clears the session and returns to `/login`
  - Mobile `375px` login/Dashboard had no horizontal overflow
  - Console errors/warnings: none observed
- Read-only cookie check:
  - No cookie: `/` returns `307` to `/login`
  - Forged default cookie `ticket_session=itsa.session.v1.authenticated`: `/` returns `200`

#### Findings
- **P2 — Default session token is forgeable if `AUTH_SESSION_TOKEN` is not overridden.** `src/lib/auth.ts:18-20` falls back to the public string `itsa.session.v1.authenticated`. Because `proxy.ts:14-24` accepts that cookie value as the session, anyone who knows the repo can set `ticket_session=itsa.session.v1.authenticated` and bypass the login form. Fix by requiring a strong `AUTH_SESSION_TOKEN` in production, adding it to `.env.example`, and failing fast when production env is missing it.
- **P2 — Server Actions still do not verify the session inside the action.** `src/app/actions.ts:32-102` validates input shape, but it does not call a server-side `requireSession()` before mutating Supabase. The proxy normally gates page/action requests, but Server Actions should still be treated like public endpoints. Add an auth check inside every mutating action, especially before ticket lifecycle/delete work expands the write surface.
- **P3 — `changeStatusAction()` still trusts client-provided previous status for timeline copy.** `src/app/actions.ts:45-59` validates that `prev` is a legal status, but it does not verify that `prev` matches the current DB row. A direct caller can create misleading text such as `Status changed from Resolved to Open` even when the row was not resolved. Fetch the current ticket status server-side before updating, or move status update + activity insert into one repo helper.
- **P3 — Handoff docs are stale.** `docs/handoff.md:44-45` still says the project has no login and is publicly writable. This is not a runtime issue, but it can mislead the next agent.

#### High-Priority Issues
- None blocking this practice/demo app.
- Before adding delete, fix the forgeable default token and add action-level session checks. Delete is a destructive mutation, so it should not be added while auth enforcement is only proxy-level.

#### Next Actions For Claude Code
1. Harden the login gate first:
   - require `AUTH_SESSION_TOKEN` in production;
   - document `AUTH_EMAIL`, `AUTH_PASSWORD`, and `AUTH_SESSION_TOKEN` in `.env.example`;
   - add a `requireSession()` helper and call it inside every mutating Server Action.
2. Tighten `changeStatusAction()` so activity text uses the current DB status, not a client-supplied `prev`.
3. Then implement the Owner's ticket lifecycle request:
   - add `closed` as a real status across TypeScript, `ticket-utils`, validation, SQL schema/migration, and UI labels;
   - make the default Dashboard list show active tickets only (`open`, `in_progress`, `waiting`);
   - keep `resolved` and `closed` visible through explicit status filtering;
   - update counts/empty states so the hidden default is obvious.
4. Add delete only from the detail page as a clearly separated danger action with confirmation; use a Server Action that validates/authenticates, deletes the ticket, relies on `activities.ticket_id ... on delete cascade`, revalidates `/`, and redirects to the Dashboard.
