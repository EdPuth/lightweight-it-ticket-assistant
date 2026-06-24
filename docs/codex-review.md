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

### Lifecycle + Delete + Email Intake Planning
- 状态：✅ Reviewed by Codex on 2026-06-22

#### Summary
- Claude Code addressed the previous security review before adding destructive mutations: production now requires `AUTH_SESSION_TOKEN`, all mutating Server Actions call `requireSession()`, and status/assignee timeline text now reads the current DB row instead of trusting client-provided previous values.
- The new `closed` status is wired through TypeScript, labels, ordering, Dashboard counts, SQL schema, and a non-destructive Supabase migration.
- Delete is intentionally placed on the detail page as a separate danger action with a confirm step. The implementation relies on the existing `activities.ticket_id ... on delete cascade`, which is appropriate for this practice app.
- MVP scope is still controlled. The app has grown beyond the original mock-only MVP, but the current code remains beginner-readable and does not add unnecessary dependencies.

#### Verification
- `npm run lint` ✅
- `npm run build` ✅
- Source review ✅
  - `src/app/actions.ts`
  - `src/lib/auth.ts`
  - `src/lib/session.ts`
  - `src/lib/tickets-repo.ts`
  - `src/lib/types.ts`
  - `src/lib/ticket-utils.ts`
  - `src/components/dashboard-client.tsx`
  - `src/components/ticket-detail.tsx`
  - `src/components/delete-ticket.tsx`
  - `supabase/migration-2026-06-21-add-closed-status.sql`

#### Findings
- **P2 — Email intake should not use the personal inbox as the first implementation.** Connecting a personal Gmail/Outlook account means OAuth scopes, mailbox privacy, duplicate handling, and accidental ingestion risks. For the practice MVP, use a dedicated test inbox/address such as `support@...` or `ticket-test@...`; if a personal mailbox must be used, only process mail sent to a dedicated alias/label and never scan the whole inbox.
- **P2 — Inbound email endpoint must use webhook authentication, not the login session.** A future `/api/email/inbound` route will be called by an email provider, not a signed-in browser. It should validate a provider signature or shared secret header such as `INBOUND_EMAIL_WEBHOOK_SECRET`, then apply the same server-side length/category/priority defaults before inserting a ticket.
- **P3 — `docs/handoff.md` is stale.** It still describes older DB-review risks as open and does not clearly include the completed D13 lifecycle/delete work. This is not a runtime issue, but it can slow down the next agent.
- **P3 — Dashboard still sends full ticket objects to the client.** This remains acceptable for the practice/demo phase. Before ingesting real emails with private descriptions, create a lightweight dashboard DTO so list rows do not ship full descriptions, requester emails, and activity history unnecessarily.
- **P3 — `deleteTicket()` does not distinguish “already deleted / not found” from success.** Supabase delete without returning rows is fine for the normal UI path, but a direct call for a missing id silently succeeds. If Claude wants tighter feedback, change it to return/select the deleted `id` and throw on not found. Not blocking.
- **P3 — Empty state copy can be more precise when all active tickets are hidden.** If every ticket is `resolved` or `closed`, the default active-only list shows “No tickets yet” even though archived tickets exist. A small prop such as `hiddenCount` would let it say “No active tickets” instead.

#### Next Actions For Claude Code
1. Start the next scope as **Email Intake v1**, not a general mailbox sync project.
2. Prefer webhook-based inbound email if the Owner has a domain or can create a test support address:
   - provider receives email;
   - provider posts parsed fields to `POST /api/email/inbound`;
   - route validates `INBOUND_EMAIL_WEBHOOK_SECRET`;
   - route inserts an `open` ticket with safe defaults;
   - route records a `created` activity like `Ticket created from inbound email.`
3. Keep v1 small:
   - no attachments;
   - no outbound email replies;
   - no threading/reopening existing tickets;
   - no personal inbox scan;
   - no new heavy dependency unless parsing the selected provider payload truly requires it.
4. Add minimal DB support for dedupe and source tracking:
   - add `source` to tickets or a small `inbound_emails` table;
   - store provider/message id with a unique constraint;
   - store sender, subject, received time, and resulting ticket id.
5. Update stale docs after implementation:
   - `docs/handoff.md`;
   - `docs/project-brief.md` if email intake becomes part of the active learning scope.

#### Email Intake References
- SendGrid Inbound Parse webhook: https://www.twilio.com/docs/sendgrid/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
- Mailgun inbound routes / route actions: https://documentation.mailgun.com/docs/mailgun/user-manual/receive-forward-store/receive-http
- Gmail API push notifications require Google Cloud Pub/Sub + mailbox watch: https://developers.google.com/workspace/gmail/api/guides/push
- Microsoft Graph mail change notifications use subscriptions/webhooks: https://learn.microsoft.com/en-us/graph/change-notifications-overview

### Scope Change — RBAC Auth v1 Planning
- 状态：📌 Planned by Owner / Codex on 2026-06-23

#### Owner Decision
- Email Intake is postponed.
- The next stage is multi-account authentication and role-based permissions.
- Roles are fixed for v1: `employee`, `it_support`, `admin`.

#### Target Permission Matrix
| Capability | Employee | IT Support | Admin |
|---|---:|---:|---:|
| Sign in | ✅ | ✅ | ✅ |
| Create ticket | ✅ own ticket | ✅ | ✅ |
| See dashboard/list | Own tickets only | All tickets | All tickets |
| See ticket detail | Own tickets only | All tickets | All tickets |
| See ticket status / IT replies | Own tickets only | All tickets | All tickets |
| Add internal note | ❌ | ✅ | ✅ |
| Insert/reply to ticket | ❌ | ✅ | ✅ |
| Change status | ❌ | ✅ | ✅ |
| Assign technician | ❌ | ✅ | ✅ |
| Delete ticket | ❌ | ❌ | ✅ |

#### Recommended Implementation Shape
- Use Supabase Auth for real users instead of extending the current single shared cookie system. Supabase's current server-side auth docs recommend cookie-aware SSR clients via `@supabase/ssr`; this is a small official helper, not a UI/framework dependency.
- Add an app-owned profile/role table instead of modifying `auth.users` directly:
  - `profiles.id uuid primary key references auth.users(id)`;
  - `profiles.email text not null`;
  - `profiles.display_name text not null`;
  - `profiles.role text not null check (role in ('employee','it_support','admin'))`.
- Add ticket ownership:
  - `tickets.requester_user_id uuid references auth.users(id)`;
  - keep `requester_name` / `requester_email` as denormalized display fields.
- Create small server helpers before changing UI:
  - `getCurrentUserProfile()`;
  - `requireRole(...allowedRoles)`;
  - `canViewTicket(profile, ticket)`;
  - `canMutateTicket(profile, action, ticket)`.
- Move access rules into Server Components / Server Actions first, then hide or disable UI controls based on role.
- For database safety, add RLS policies as part of this scope or as a tightly coupled follow-up:
  - Employees can select/insert their own tickets.
  - IT Support/Admin can select/update all tickets.
  - Only Admin can delete tickets.
  - Activity visibility follows ticket visibility.
- Keep v1 small: no invite flow, no password reset customization, no custom role management UI, no teams/departments, no audit log beyond the existing activity timeline.

#### Review Risks To Watch
- **P1 — Do not rely only on UI hiding.** If an Employee cannot delete in the UI but can call `deleteTicketAction()` directly, the permission model is broken. Every Server Action must enforce role permissions.
- **P1 — Avoid service-role bypass for user-scoped reads/writes.** The current repo uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. RBAC should either use user-scoped Supabase clients for normal app access or pair service-role calls with explicit server-side role checks. Prefer moving toward anon/authenticated + RLS where practical.
- **P2 — Do not use `requester_email` as the security boundary.** Employee isolation needs `requester_user_id = auth.uid()` or an equivalent immutable user id. Email is display data.
- **P2 — Seed/migrate old tickets deliberately.** Existing tickets have no owner. Decide whether to assign them to a demo employee, leave them visible only to support/admin, or backfill based on seeded requester emails.
- **P2 — RLS policy performance matters.** Add indexes for columns used in policies, especially `tickets.requester_user_id` and any FK/role lookups. Wrap functions like `auth.uid()` with `select` in policies when appropriate.

#### Next Actions For Claude Code
1. Draft a short RBAC implementation plan before coding, including schema migration, auth/session changes, and permission matrix.
2. Add Supabase Auth SSR plumbing and replace the current single-account `auth.ts` flow.
3. Add profile/role and ticket owner schema migrations; include seed/test account instructions.
4. Update repo read functions so Employee gets only own tickets while support/admin get all.
5. Update every mutating Server Action with role checks:
   - create: all roles;
   - status/assign/note/reply: `it_support` + `admin`;
   - delete: `admin` only.
6. Update UI last: show role-aware dashboard/detail controls without redesigning the whole app.
7. Run `npm run lint`, `npm run build`, and browser smoke tests for all three roles.

#### References
- Supabase SSR Auth docs: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase RLS docs: https://supabase.com/docs/guides/database/postgres/row-level-security

### RBAC Auth v1 — Supabase Auth + Roles Review
- 状态：✅ Reviewed by Codex on 2026-06-23

#### Summary
- RBAC v1 is a solid step up from the previous single shared login. Supabase Auth handles real sessions, `profiles.role` holds the app role, and the main Server Actions enforce the role matrix server-side.
- Employee isolation uses `tickets.requester_user_id`, not email, which is the right security boundary.
- IT Support/Admin processing and Admin-only delete are enforced in Server Actions, not just hidden in the UI.
- The performance cleanup is sensible: dashboard rows no longer fetch activities, which also reduces client payload.
- This is still application-layer authorization with service-role DB access. That is acceptable for this practice stage, but RLS remains the next security hardening step before real/private data.

#### Verification
- `npm run lint` ✅
- `npm run build` ✅
- Source review ✅
  - `src/lib/auth.ts`
  - `src/lib/supabase/auth-server.ts`
  - `src/proxy.ts`
  - `src/app/actions.ts`
  - `src/app/page.tsx`
  - `src/app/tickets/[id]/page.tsx`
  - `src/app/tickets/new/page.tsx`
  - `src/lib/tickets-repo.ts`
  - `src/components/dashboard-client.tsx`
  - `src/components/ticket-detail.tsx`
  - `supabase/migration-2026-06-23-rbac.sql`
  - `scripts/seed-users.ts`

#### Findings
- **P2 — Detail page metadata can leak another user's ticket title.** `src/app/tickets/[id]/page.tsx:21-30` calls `getTicketById()` inside `generateMetadata()` and returns the real ticket title before doing the `canViewTicket()` check used by the page body. An Employee who opens someone else's ticket URL should see a generic "Ticket not found" title, not the hidden ticket's title in browser metadata. Fix by either making metadata generic for all ticket detail pages or loading `getCurrentUserProfile()` and applying `canViewTicket()` before returning a specific title.
- **P2 — RLS is still not implemented.** The app now has strong application-layer role checks, but all data access still uses the service-role client, which bypasses database RLS. This is acceptable for the practice app, but any move toward real data should add Supabase RLS policies for `tickets`, `activities`, and `profiles`.
- **P3 — Employee create form still asks for requester name/email.** `createTicketAction()` correctly stamps `requesterUserId` from the session, so this is not a security bug. But for Employee UX, the form can imply they are creating a ticket for someone else. Prefer pre-filling and locking requester name/email for Employee, while allowing support/admin to create on behalf of someone if that becomes an explicit requirement.
- **P3 — `deleteTicket()` still silently succeeds on a missing id.** This is not new and not blocking. If tightening admin behavior, make delete return/select the deleted id and throw a not-found error when no row was deleted.
- **P3 — Docs still mention some old single-login/env details.** README is mostly updated, but `docs/handoff.md` and older review sections are stale. A short docs cleanup pass after the next feature would help Claude read less historical noise.

#### Next Actions For Claude Code
1. Fix the P2 metadata leak before starting AI work.
2. Keep RLS as the next security follow-up, but Owner has chosen to proceed with AI API v1 first for testing. Do not put real/private tickets into the system until RLS is done.
3. Implement **AI API v1** as a narrow, server-only integration:
   - API key only in server env, never client-side;
   - one provider adapter module, so the Owner can test with their own API and swap providers later;
   - Server Action or Route Handler that only `it_support` / `admin` can call;
   - preserve the existing local template fallback when the API fails or env is missing;
   - return structured data for reply draft, category suggestion, priority suggestion, and confidence/reasoning.
4. For category/priority suggestions, require enum-safe output:
   - category must be one of `email | network | hardware | software | access | other`;
   - priority must be one of `low | medium | high | urgent`;
   - invalid model output must be rejected or normalized server-side before touching UI/state.
5. Keep the future FAQ / knowledge base flexible:
   - do not hard-code FAQ copy inside components;
   - evolve `solutionTemplates` or create a small `knowledge-base` data module/table;
   - design AI prompts so they can later include relevant FAQ entries as context.

#### AI API References
- OpenAI text generation docs: https://developers.openai.com/api/docs/guides/text
- OpenAI structured outputs docs: https://developers.openai.com/api/docs/guides/structured-outputs

### AI API v1 — Claude Suggestions Review
- 状态：✅ Reviewed by Codex on 2026-06-24

#### Summary
- The previous RBAC metadata leak is fixed: `generateMetadata()` now loads the profile and applies `canViewTicket()` before returning a real ticket title.
- The AI integration is correctly server-side: `@ai-sdk/anthropic` and `ai` are only imported from `src/lib/ai/*`, and the client component calls Server Actions instead of touching the provider or API key directly.
- The provider adapter is a good seam for this practice project. It is Anthropic-specific today, but the rest of the app depends on `generateTicketSuggestion()` rather than provider details.
- Structured output is a good choice: category/priority are constrained by schema and rechecked with existing enum guards before reaching the UI.
- Staff-only access is enforced server-side by `requireRole("it_support", "admin")` in both AI Server Actions.

#### Verification
- `npm run lint` ✅
- `npm run build` ✅
- Source review ✅
  - `src/lib/ai/provider.ts`
  - `src/lib/ai/suggest.ts`
  - `src/app/actions.ts`
  - `src/components/ai-suggested-reply.tsx`
  - `src/app/tickets/[id]/page.tsx`
  - `src/lib/tickets-repo.ts`
  - `src/lib/validation.ts`
  - `.env.example`
  - `README.md`

#### Findings
- **P2 — AI reply draft needs a server-side length cap before it reaches the UI.** `src/lib/ai/suggest.ts:45-49` describes `replyDraft` but does not set a max length, and `src/lib/ai/suggest.ts:125-126` returns the model draft directly. `insertReplyAction()` later validates replies with the existing 5000-character note limit, so an overlong model output can look generated successfully but fail when staff clicks "Insert as reply." Add `maxLength` to the JSON schema and/or clamp `replyDraft` to `LIMITS.note` before returning.
- **P3 — AI calls have no explicit response budget.** The default model is currently `claude-opus-4-8`, which is valid but premium. For a practice app, set a bounded output budget and document `AI_MODEL` examples such as a cheaper Sonnet/Haiku option. This keeps accidental testing costs predictable.
- **P3 — Apply suggestion has no visible failure state.** `src/components/ai-suggested-reply.tsx:151-170` starts the `applySuggestionAction()` transition but does not catch/report errors. If the update fails, the button simply becomes usable again with no explanation. A small `applyError` message would match the rest of the app's friendly error states.
- **P3 — README top summary was stale.** `README.md:8-10` still said the app used a single shared login and had no real AI API, while the implemented feature list correctly said RBAC + Claude API. I fixed the top note during this review so the first impression is accurate.
- **P3 — Decision log has duplicate D15 headings.** `docs/decisions.md` contains both the planning D15 and the implementation D15. Not a runtime issue, but it makes the handoff harder to scan. Rename the first to "D15 plan" or merge them during the next docs cleanup.

#### Next Actions For Claude Code
1. Fix the P2 AI draft length cap before starting FAQ work.
2. Do a tiny docs cleanup:
   - duplicate D15 headings;
   - remove stale "AI API next" text from `docs/tasks.md`.
3. Start **FAQ / Guideline v1** for `admin` and `it_support` only:
   - add a staff-only FAQ index page;
   - add individual guideline pages;
   - start with TS data, not a database table, unless Owner asks for editing UI;
   - include at least Outlook email issues, MAM app assignment, and email auto-reply/forwarding setup.
4. Add related FAQ hints on ticket detail:
   - if a ticket matches Outlook/email keywords, show a small non-blocking hint;
   - link directly to the relevant guideline;
   - hide the hint from Employee.
5. Keep it flexible for future AI context:
   - do not hard-code FAQ body text inside components;
   - use reusable fields like `id`, `title`, `summary`, `category`, `keywords`, `body/sections`, `template`;
   - make AI prompt context later read from the same data source.

#### References
- Anthropic model IDs and current Claude API models: https://platform.claude.com/docs/en/about-claude/models/overview
- Vercel AI SDK Anthropic provider docs: https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
