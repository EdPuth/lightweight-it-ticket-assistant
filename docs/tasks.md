# Tasks — 阶段清单与进度

> 每完成一个阶段，更新本文件的 Completed / Next / Risks 三节。

## 阶段总览

| 阶段 | 任务 | 验收标准 | 状态 |
|---|---|---|---|
| Phase 0 | 初始化 Next.js；创建 README/CLAUDE.md/AGENTS.md/docs/* | `npm run dev` 可运行；docs 存在；范围清晰 | ✅ 完成 |
| Phase 1 | Ticket 类型、mock 数据、ticket utils | 页面可读 mock data；不滥用 any | ✅ 完成 |
| Phase 2 | Dashboard 统计、筛选、搜索、列表 | 可按状态/优先级筛选；搜索可用；空状态可用 | ✅ 完成 |
| Phase 3 | `/tickets/[id]`、timeline、status badge | 点击可进详情；无效 id 友好提示 | ✅ 完成 |
| Phase 4 | `/tickets/new` 表单 + 校验 | 字段清楚；校验可用；mock 提交 | ✅ 完成 |
| Phase 5 | mock AI suggested reply | loading/生成/复制状态；标注 suggested draft | ✅ 完成 |
| Phase 6 | responsive、a11y、README、review notes | 本地运行正常；docs 记录下一步 | ✅ 完成 |
| DB Ext 1 | Supabase 脚手架：依赖/schema/seed/env/client/docs | 文件就位；`build` 通过；不破坏现有 mock 运行 | ✅ 完成 |
| DB Ext 2 | 读迁移：Dashboard/详情读 DB | 列表/详情从 Supabase 读出 | ✅ 完成 |
| DB Ext 3 | 写迁移：Server Actions 落库 | 创建/改状态/备注/指派/插入回复持久化 | ✅ 完成 |
| DB Ext 4 | Vercel 部署 + 文档收尾 | 线上可读写；README/docs 更新 | ✅ 完成 |
| RBAC Auth v1 | 多账号登录 + Employee / IT Support / Admin 权限 | 不同角色看到/能做的操作符合权限矩阵；服务端校验不只靠 UI 隐藏 | ✅ 完成 |
| AI API v1 | 接入真实 API 生成回复、分类、优先级建议 | server-only API key；结构化输出；失败时可回退本地模板 | ⏭️ 下一步 |

---

## Completed
- **MVP Phases 0-6 — Completed Summary**
  - Set up Next.js 16 / React 19 / Tailwind v4, project docs, prompts, and two-agent workflow.
  - Built the mock-ticket foundation: typed `Ticket` / `TicketActivity`, mock data, utility functions, labels, ordering, badges, and date formatting.
  - Built the Typora-style Dashboard with status cards, priority filter, search, ticket list, empty states, and responsive polish.
  - Built `/tickets/[id]` detail pages with metadata, timeline, status changes, internal notes, assignee selection, and friendly invalid-id state.
  - Built `/tickets/new` with accessible controlled form validation and later migrated submit behavior from mock to Supabase persistence.
  - Built mock AI suggested replies from local solution templates, including copy/insert/regenerate states and tighter keyword matching.
  - Completed English UI localization, README accuracy pass, accessibility/responsive smoke checks, and Codex reviews with no remaining Phase 0-6 blockers.

- **Database Extension — Step 1（Supabase 脚手架）**
  - 加依赖 `@supabase/supabase-js`（决策 D9）。
  - `supabase/schema.sql`（tickets + activities + check 约束 + RLS 开但无 public policy +
    TKT-#### 序列）、`supabase/seed.sql`（由 `scripts/gen-seed.ts` 从 13 条 mock 生成：13 工单 + 31 活动）。
  - `.env.example`、`src/lib/supabase/server.ts`（service-role 懒加载单例，仅服务端）。
  - `docs/db-setup.md`（建库 + 灌种子 + 本地 + Vercel 的手把手指南）、decisions D9/D10。
  - 本步只新增文件、不改读写路径 → 现有 mock 应用照常运行；`build` 通过。

- **DB Ext Step 2 — 读迁移**：`tickets-repo` 读函数；`page.tsx` 改 Server Component 读 DB；
  `dashboard-client.tsx` 承接筛选/搜索；`[id]` 用 repo；两页 force-dynamic。已用真实库验证。
- **DB Ext Step 3 — 写迁移**：`actions.ts` 五个 Server Actions（create/changeStatus/assign/
  addNote/insertReply）+ repo 写函数；详情页 `useTransition`/`useOptimistic`；创建表单落库 + redirect。
  真实库验证：建 TKT-1014、改状态整页刷新后仍在、Dashboard 计数变化，清理回 13。
- **DB Ext Step 4 — Vercel 部署 + 收尾**：导入仓库 + 配 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
  环境变量；线上 https://lightweight-it-ticket-assistant.vercel.app 验证读写均通（线上创建了 TKT-1015，
  与本地连同一个库）。README 改为真实 Supabase 数据模型。
- **Codex Review — Database Extension**
  - 已 review Supabase schema、server-only client、`tickets-repo`、Server Actions、Vercel/env docs 与 README。
  - `npm run lint` 通过；`npm run build` 在允许 `next/font` 联网后通过。
  - 只读本地 smoke 通过：Dashboard、`/tickets/TKT-1001`、`/tickets/new` 均返回 200 并读取 Supabase 数据。
  - `docs/codex-review.md` 已追加 DB Extension review；README 已修正旧的 mock-only 文案。

- **Hardening — Server Actions runtime validation + insertActivity 错误检查**（处理 Codex DB review 的 [P2]/[P3]，决策 D11）
  - 新增 `src/lib/validation.ts`（**无新依赖**）：复用 `ticket-utils.ts` 的 `STATUS_ORDER` /
    `PRIORITY_ORDER` / `CATEGORY_ORDER` 做枚举校验；`validateCreateTicketInput` / `validateStatus` /
    `validateAssignee` / `validateNoteContent` / `validateTicketId` 统一 trim + 非空 + 长度上限
    （`LIMITS`），非法输入抛 `ValidationError`；邮箱做格式校验并小写化。
  - `src/app/actions.ts` 五个 Server Action（create / changeStatus / assign / addNote / insertReply）
    入口先校验再落库；空/无变化的提前返回逻辑保留，正常 UX 不变（客户端 button disabled 守卫仍在），
    只拦截绕过客户端的滥用路径（超长字符串、非法 enum、错误 `prev`）。
  - `src/lib/tickets-repo.ts` 的 `insertActivity()` 现在检查 `updated_at` 更新的 `{ error }` 并抛错，
    避免活动已写入但列表排序 / 新鲜度时间静默过期。
  - `npm run lint` / `npm run build` 通过。纯服务端加固，不改数据模型 / UI / 现有正常流程。

- **Auth Gate — 全站登录门禁（单账号，Owner 要求，决策 D12）**
  - `src/lib/auth.ts`：单账号凭据（`itsupport@outlook.com` / `123456`）+ session 常量 +
    `verifyCredentials` / `isValidSession`；仅服务端读，可用 `AUTH_EMAIL` / `AUTH_PASSWORD` /
    `AUTH_SESSION_TOKEN` env 覆盖。
  - `src/app/login/actions.ts`：`loginAction`（校验 → 设 httpOnly cookie → redirect `/`）+
    `logoutAction`（清 cookie → redirect `/login`）。
  - `src/proxy.ts`：**Next.js 16 的 middleware 改名 proxy**；未登录访问非 `/login` → 跳 `/login`，
    已登录访问 `/login` → 跳 `/`。
  - 登录页 `src/app/login/page.tsx` + `src/components/login-form.tsx`（`useActionState`，
    用 `/frontend-design` 设计）：沿用 Typora 风格 + 状态四圆点脉冲 / 双 aura 漂移 / 点阵网格特效
    （`globals.css`，遵循 `prefers-reduced-motion`）。Dashboard 顶部加 Sign out
    （`src/components/logout-button.tsx`）。
  - `npm run lint` / `npm run build` 通过；浏览器验证全流程：未登录 `/`→`/login`、错误凭据报错、
    正确凭据 → Dashboard、Sign out → 重新被门禁拦截，无 console 报错。无新依赖。
- **Codex Review — Hardening + Login Gate**
  - 已 review `validation.ts`、`auth.ts`、`proxy.ts`、login actions/page/form、Dashboard logout、
    Server Actions 加固和 repo 更新。
  - `npm run lint` / `npm run build` 通过；Browser smoke 通过：未登录跳 `/login`、错误凭据报错、
    正确登录进入 Dashboard、Sign out 返回 `/login`、移动端无横向溢出、无 console 报错。
  - 发现需先修的风险：默认 `AUTH_SESSION_TOKEN` 可伪造；Server Actions 仍未在 action 内显式验 session；
    status timeline 的 `prev` 仍来自客户端。详见 `docs/codex-review.md` 最新一节。

- **Lifecycle + Delete + Auth Hardening（决策 D13，按 Codex 顺序：先安全→再 closed/筛选→最后删除）**
  - 安全：`auth.ts` 生产强制 `AUTH_SESSION_TOKEN`（缺失即抛错，dev 用 dev-only 回退）；新增
    `session.ts` 的 `requireSession()` 并加到全部 6 个写 Action；`changeStatusAction` /
    `assignAction` 改为服务端读 DB 当前值（`getTicketFields`），不再信任客户端 `prev`，签名简化为
    `(ticketId, next)`。
  - 生命周期：新增 `closed` 状态（types / `ticket-utils` / SQL check + 迁移文件 / 详情 select）；
    `ACTIVE_STATUSES`；Dashboard 默认只显示 active，resolved/closed 需点状态卡片；统计卡片 5 张 +
    结果行隐藏数量提示。
  - 删除：`deleteTicketAction`（requireSession + 校验 + hard delete + cascade + redirect `/`）+
    `tickets-repo.deleteTicket` + 详情页红色 danger 区二次确认（`delete-ticket.tsx`）。
  - `.env.example` 补 `AUTH_EMAIL` / `AUTH_PASSWORD` / `AUTH_SESSION_TOKEN`；README / handoff 同步。
  - `npm run lint` / `npm run build` 通过；浏览器验证：active-only 默认 + 隐藏提示、点 Resolved 卡片出
    3 条、改状态 timeline 文案用 DB prev（Open→In Progress）、删除 TKT-1015 后回 Dashboard 且总数 15→14、
    无 console 报错。
  - **运维待办（需 Owner）**：① Supabase 跑 `supabase/migration-2026-06-21-add-closed-status.sql`
    才允许 `closed`；② Vercel 设 `AUTH_SESSION_TOKEN` 否则生产运行时抛错。

- **RBAC Auth v1 — Supabase Auth + 三角色（决策 D14，Owner 开新 scope）**
  - 认证换成 **Supabase Auth + `@supabase/ssr`**（新增依赖 + env `SUPABASE_ANON_KEY`）；删除原单账号
    `auth.ts` 常量与 `session.ts`。`login/actions.ts` 改用 `signInWithPassword`/`signOut`；
    `proxy.ts` 改用 Supabase session 门禁（无 anon key 时 fail-closed 跳 `/login`）。
  - DB：`profiles`（id→auth.users + role check）+ `tickets.requester_user_id` + 索引；
    `supabase/migration-2026-06-23-rbac.sql`（非破坏）+ `schema.sql` 同步。
  - 角色 helper（`auth.ts` 重写）：`getCurrentUserProfile` / `requireProfile` / `requireRole` /
    `canViewTicket` / `canProcessTickets` / `canDeleteTickets`。
  - 数据/动作按矩阵强制（服务端）：employee 只看/建自己的（`listTickets({ownerUserId})` + 详情
    `canViewTicket` 越权当 not-found + create stamp `requester_user_id`）；status/assign/note/reply
    限 it_support+admin；delete 限 admin。**UI 按角色隐藏控件（详情页 `canProcess`/`canDelete`），
    但安全靠服务端不靠隐藏。**
  - 种子：`scripts/seed-users.ts`（建 admin/support/employee 三账号 + 回填旧工单给 employee）。
  - `npm run lint` / `npm run build` 通过；本地 smoke：无 anon key 时 `/`→`/login`（fail-closed）、
    `/login` 200、登录页渲染正常、无 console 报错。**完整三角色验证需 Owner 先做下方运维步骤。**
  - **运维待办（需 Owner，按顺序）**：① 本地 `.env.local` + Vercel 加 `SUPABASE_ANON_KEY`；
    ② Supabase SQL Editor 跑 `migration-2026-06-23-rbac.sql`；③ `node --env-file=.env.local
    scripts/seed-users.ts` 建账号 + 回填；④ 确认 Supabase 启用 Email 登录（默认开）。

- **AI API v1 — 真实 LLM 建议 + metadata 越权修复（决策 D15）**
  - 先修 Codex P2：`generateMetadata` 改为先 `canViewTicket` 再返回标题（员工打开他人工单不再从浏览器
    标题泄露），`getTicketById` 包 `cache()` 去重。
  - 接入 **Claude（Vercel AI SDK：`ai` + `@ai-sdk/anthropic`）**：`src/lib/ai/provider.ts`（adapter，
    可换 provider）+ `src/lib/ai/suggest.ts`（`generateObject` + `jsonSchema` 产结构化结果，enum 服务端
    再校验，KB 模板作上下文，AI 未配置/失败回退本地模板）。
  - Server Actions：`generateSuggestionAction`（staff-only 只读）+ `applySuggestionAction`（staff-only，
    enum 校验后改 priority/category + 记 activity）；`updateTicketFields` 支持 priority/category；
    `validation.ts` 加 `validatePriority`/`validateCategory`。
  - UI：`ai-suggested-reply.tsx` 调真实 action，展示草稿 + 建议优先级/分类（一键 Apply）+ 理由 + 信心 +
    来源徽标；密钥不进客户端。
  - `npm run lint` / `npm run build` 通过；浏览器验证：metadata 越权（tom 开 jerry 的 TKT-1002 → 通用
    "Ticket not found" 标题）、AI 面板 fallback（Local template 徽标 + 草稿 + 建议行 + 理由 + Apply），
    无 console 报错。真实 AI 路径需 Owner 配 `ANTHROPIC_API_KEY` 才能测。
  - **运维待办（需 Owner）**：本地 `.env.local` + Vercel 加 `ANTHROPIC_API_KEY`（不加则自动用本地模板兜底）。

## Next（下一步）
- **当前状态**：MVP、Supabase 持久化、Vercel 部署、RBAC Auth v1（三角色）、runtime validation、
  `closed` 生命周期、active-only Dashboard、删除、**AI API v1（真实 Claude 建议 + 本地兜底）** 均完成。
- **Owner 运维待办（如果还没做）**：
  - Supabase SQL Editor 跑 `migration-2026-06-21-add-closed-status.sql` 与 `migration-2026-06-23-rbac.sql`。
  - 跑 `node --env-file=.env.local scripts/seed-users.ts` 建账号 + 回填。
  - Vercel 环境变量：`SUPABASE_ANON_KEY`（RBAC 必需）、`AUTH_SESSION_TOKEN`（已废弃，RBAC 后不再用）、
    可选 `ANTHROPIC_API_KEY`（开真实 AI；不加则用本地模板兜底）。
- ~~下一阶段：RBAC Auth v1（多账号 + 角色权限）~~ **已完成（决策 D14）**：Supabase Auth +
  `@supabase/ssr`、`profiles`/`requester_user_id`、服务端角色强制（employee 只看/建自己的；
  support/admin 处理全部；仅 admin 删除）、UI 按角色隐藏、`scripts/seed-users.ts` 种 3 账号。
- **RBAC 运维待办（需 Owner，按顺序，否则登录/角色不可用）**：
  - 本地 `.env.local` + Vercel 三处都加 `SUPABASE_ANON_KEY`。
  - Supabase SQL Editor 跑 `supabase/migration-2026-06-23-rbac.sql`。
  - `node --env-file=.env.local scripts/seed-users.ts` 建账号 + 回填旧工单。
  - 确认 Supabase 启用 Email 登录（默认开）。
- **Codex RBAC review 待修**：
  - 先修 `src/app/tickets/[id]/page.tsx` 的 metadata 权限泄露：`generateMetadata()` 不能在未做
    `canViewTicket()` 前返回隐藏 ticket 的真实 title。
- **下一阶段：AI API v1（Owner 用自己的 API key 测试）**
  - API key 只放 server env，例如 `AI_API_KEY` / `AI_API_BASE_URL` / `AI_MODEL`，不要暴露到 client。
  - 加一层 provider adapter（例如 `src/lib/ai/provider.ts`），UI/业务代码不要直接依赖某个供应商 SDK。
  - 只允许 `it_support` / `admin` 调用 AI 生成；Employee 只查看 IT 回复，不看到生成控件。
  - 保留当前 `reply-templates.ts` 本地模板作为 fallback：API 未配置、失败、超时、返回无效结构时仍能生成 mock draft。
  - 返回结构化结果：`replyDraft`、`suggestedCategory`、`suggestedPriority`、`confidence`、`reason`。
  - `suggestedCategory` / `suggestedPriority` 必须做 enum 校验，不能直接信模型输出。
  - v1 只做“建议”，不要自动改 ticket 分类/优先级；让 support/admin 手动确认应用。
- **AI API 后的下一阶段：FAQ / Knowledge Base（Admin + IT Support）**
  - 为常见 ticket 问题做可扩展 FAQ/解决方案模块，优先复用或演进 `solutionTemplates` 的数据形状。
  - 页面只给 `admin` / `it_support` 看；Employee 暂不需要 FAQ 管理入口。
  - 保持数据驱动，方便之后新增 FAQ、搜索、把 FAQ 作为 AI prompt context。
  - 不要把 FAQ 文案硬编码在组件里；先用 TS data module，后续可迁移到 Supabase 表。
- **安全 follow-up 仍保留**：Supabase RLS policies（employee 只能 select/insert 自己的、support/admin 全部、
  仅 admin delete、activity 可见性跟随 ticket），在放真实/私有数据前必须做。

## Risks（风险 / 注意）
- Next.js 16：App Router 的 `params` / `searchParams` 是 **Promise**，详情页需 `await`。
- Tailwind v4：CSS-first 配置（`@import "tailwindcss"` + `@theme`），无 `tailwind.config.js`。
- 范围蔓延风险：MVP + DB extension 已完成；后续不要顺手扩成企业级 helpdesk，除非 Owner 明确开新 scope。
- README 已在 DB review 中更新为 Supabase persistence + Vercel deployment；后续如果扩 scope，需要同步维护。
- ~~公开无登录 / 单账号共享凭据~~：已升级为 **RBAC Auth v1**（Supabase Auth + 三角色，D14）。
- **RBAC 仍是应用层强制 + service-role 写**（非数据库 RLS）：若直接拿 service-role key 或绕过应用层
  仍可越权读写。真实/私有数据前必须加 RLS policies（follow-up）。UI 隐藏不是权限边界，已在服务端强制。
- Detail metadata 泄露风险：`generateMetadata()` 必须遵守与页面 body 相同的 `canViewTicket()` 规则，
  否则 Employee 可能在 browser title/head 中看到别人的 ticket 标题。
- AI API 风险：API key 绝不能放进 client bundle；所有 AI 调用必须走 Server Action / Route Handler。
- AI 输出风险：模型建议的 category/priority 只能作为 suggestion，必须经过 enum 校验并由 support/admin 确认。
- FAQ/Knowledge Base 范围风险：先做轻量、数据驱动的常见问题模块，不要扩成完整 CMS 或文档平台。
- `@supabase/ssr` 是第二个运行时依赖（D14）：升级 Supabase 时需一并验证 SSR cookie 行为。
- ~~默认 session token 可伪造~~：已修（D13）——生产强制 `AUTH_SESSION_TOKEN`，缺失即抛错；
  dev 回退 token 仅本地用。**注意：Vercel 必须设置该环境变量，否则生产运行时报错。**
- ~~Server Actions 缺 action-level session check~~：已修（D13）——所有写 Action 开头 `requireSession()`。
- ~~`changeStatusAction()` 信任客户端 `prev`~~：已修（D13）——服务端从 DB 读当前状态（`assignAction` 同样处理）。
- `closed` 状态需要 DB 迁移：旧库未跑 `migration-2026-06-21-add-closed-status.sql` 前，把工单改成
  Closed 会被旧 check 约束拒绝。
- RBAC 不能只靠前端隐藏按钮：Server Actions / repo / RLS 都必须按角色检查权限。
- 当前 repo 仍大量使用 service-role admin client；做 RBAC 时要避免继续用它绕过 RLS 来服务普通用户请求。
- Employee ticket 隔离需要 DB 字段支持，不能只用 `requester_email` 过滤；邮箱可变且容易伪造。
- 做 RLS policy 时，`tickets.requester_user_id`、`profiles.role` 等 policy 相关列要有索引，避免后续性能问题。
- 迁移真实库前要先备份/确认 seed 数据归属：旧 ticket 没有 `requester_user_id`，需要给历史数据指定 owner 或允许 support/admin 可见。
- `docs/handoff.md` 仍需压缩/同步：里面还有较早 DB review 的已修风险，下一轮文档收尾可清理。
- ~~Server Actions 是公开 endpoint：依赖客户端校验和 TS 类型，仍需补 runtime validation / 长度限制 / transition 校验~~：已在 Hardening 阶段补齐（`src/lib/validation.ts`，决策 D11）。
- ~~`insertActivity()` 没有检查后续 `tickets.updated_at` 更新错误~~：已在 Hardening 阶段加上 `{ error }` 检查并抛错。
- ~~starter `layout.tsx` / `page.tsx`~~：已在 Phase 2 替换为项目真实 metadata 与 Dashboard 首页。
- ~~少数 mock activity 跳过中间状态~~：已在 Phase 3 为 TKT-1005/1007/1008 补齐 open→in_progress。
- `formatRelativeTime()` 默认使用 `Date.now()`；当前页面用 `formatDateTime()`（确定性 UTC 输出），
  新增活动的时间在事件回调里生成（非渲染期），无 hydration 风险。
- ~~ticket card / "+ New ticket" 链接 404~~：详情页（Phase 3）与创建页（Phase 4）均已实现。
- ~~详情页状态切换 / 新增备注、创建页提交仅内存~~：DB Ext Step 3 已改为 Supabase 持久化。
- ~~创建的工单不会出现在列表/详情里~~：DB Ext Step 3 已改为创建后落库并 redirect 到详情。
- ~~创建页 mock id 随机碰撞风险~~：已在 Phase 5 改成 timestamp-based mock id。
- ~~详情页 metadata 缺少显式 `<dl>`~~：已在 Phase 5 修正。
- ~~筛选无结果时有两个 "Clear filters" 按钮~~：已在 Phase 6 去重。
- ~~AI suggested reply 模板匹配过宽~~：已在 Phase 6 改成具体关键词命中，category 不再自动选模板。
- ~~Copy 失败静默吞掉~~：已在 Phase 6 增加 "Copy failed — select & copy manually" 可见反馈。

## 后续扩展方向（不在 MVP 内）
- ~~加入 Supabase 存储真实 tickets~~：DB Extension 已完成。
- ~~登录与角色权限：employee / IT support / admin（建议作为下一个生产化 scope）~~：已升级为下一阶段 RBAC Auth v1。
- 邮件入站生成 ticket：暂缓，等 RBAC/Auth 稳定后再做。
- ~~接入真实 AI API 生成回复、分类和优先级建议~~：已升级为下一阶段 AI API v1。
- Admin / IT Support FAQ（常见 ticket 问题 / 知识库）：AI API v1 后做，保持 `solutionTemplates` 可演进。
- ~~部署到 Vercel~~：DB Ext Step 4 已完成。
- **（Owner 提出）关键词搜索以往 ticket**：technician 用 Outlook / email 等关键词找到历史相关工单。
  扩展点已就绪：复用 `reply-templates.ts` 的 `matchScore`，并让 `searchTickets` 也匹配 `description`。
- **（Owner 提出）邮箱问题知识库**：把常见解决方案做成文档（.ost 过满、申请他人 inbox 访问、
  Outlook classic 无法同步等）。`reply-templates.ts` 的 `solutionTemplates` 已作为数据种子，
  后续渲染成独立文章页即可（详见决策 D8）。
