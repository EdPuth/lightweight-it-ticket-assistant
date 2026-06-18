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
| DB Ext 3 | 写迁移：Server Actions 落库 | 创建/改状态/备注/指派/插入回复持久化 | ⬜ 待开始 |
| DB Ext 4 | Vercel 部署 + 文档收尾 | 线上可读写；README/docs 更新 | ⬜ 待开始 |

---

## Completed
- **Phase 0 — Setup & Docs**
  - 用 create-next-app 初始化 Next.js 16 + TypeScript + Tailwind v4（App Router、`src/` 目录）。
  - 创建 README.md、CLAUDE.md、AGENTS.md。
  - 创建 docs/：project-brief.md、frontend-spec.md、tasks.md、decisions.md、
    codex-review.md（占位）、prompts/claude-plan-mode-prompt.md、prompts/codex-review-prompt.md。
  - git 已初始化（脚手架完成首次 commit）。
- **Codex Review — Phase 0**
  - 已核对 PDF、project brief、tasks、README、agent prompts 和当前源码。
  - `npm run lint` 与 `npm run build` 均通过。
  - `docs/codex-review.md` 已更新；未发现高优先级阻塞问题。
- **Phase 1 — Data Model**
  - `src/lib/types.ts`：Ticket / TicketActivity + 字面量联合类型（status/priority/category/
    activity type）+ StatusFilter / PriorityFilter（供 Phase 2 复用）。无 `any`。
  - `src/lib/mock-tickets.ts`：10 条多样化 mock 工单，覆盖各 status/priority/category，每条带
    activity timeline。
  - `src/lib/ticket-utils.ts`：纯函数 getTicketById / searchTickets / filterTickets /
    applyTicketFilters / countByStatus / sortByUpdatedDesc，确定性日期格式化
    formatDateTime / formatRelativeTime，集中的 label 与 badge 颜色映射 + 顺序数组。
  - `npm run lint` 与 `npm run build` 均通过。未引入任何新依赖。
- **Codex Review — Phase 1**
  - 已 review `src/lib/types.ts`、`src/lib/mock-tickets.ts`、`src/lib/ticket-utils.ts`。
  - `npm run lint` 与 `npm run build` 均通过。
  - `docs/codex-review.md` 已追加 Phase 1 review；未发现高优先级阻塞问题。

- **Phase 2 — Dashboard & Ticket List**
  - Owner 设计方向：refined minimal / editorial（Typora 风格）—— 暖白底 + 纯白浮起卡片、近乎单色、
    衬线标题/数字、状态圆点为唯一彩色。记录于 `docs/decisions.md` D6。
  - 字体：next/font 引入 Fraunces（衬线）/ Hanken Grotesk（正文）/ JetBrains Mono（ID），
    非 npm 依赖；中文回退 PingFang。
  - 组件：`status-badge.tsx`、`priority-badge.tsx`、`stat-card.tsx`（可点击=状态筛选）、
    `ticket-filters.tsx`（搜索 + 优先级 select + 清除）、`ticket-card.tsx`（浮起卡片）、
    `ticket-list.tsx`（含"无工单"与"无匹配"两种空状态）。颜色统一来自 `ticket-utils.ts` 的 DOT 映射。
  - `src/app/page.tsx`：`'use client'` + `useState`/`useMemo`，统计、搜索 + 状态 + 优先级筛选、
    按更新时间排序。无 URL searchParams。
  - 替换 starter 的 `layout.tsx` metadata 与首页；移除 dark-mode 自动切换（固定白色基调）。
  - 将 `ticket-utils.ts` 的 `*_BADGE_CLASS` 改为 `*_DOT_CLASS`（圆点配色），契合单色设计。
  - `npm run lint` / `npm run build` 通过；浏览器验证统计/筛选/搜索/无结果空状态均可用。未加 npm 依赖。
  - 微交互打磨：hover 悬浮抬升（cubic-bezier 丝滑缓动）；进场卡片"逐个浮现"（`.rise` fade-up +
    错开 animation-delay）。入场放外层包裹、hover 放卡片本身分层，避免动画 fill 顶掉 hover；
    遵循 `prefers-reduced-motion`。
- **Codex Review — Phase 2**
  - 已 review Dashboard 页面、filters/list/card/badge/stat 组件、CSS tokens、D6 决策记录。
  - `npm run lint` 与 `npm run build` 均通过。
  - 浏览器验证通过：页面加载、状态筛选、优先级筛选、搜索无结果、清除筛选、移动端首屏。
  - `docs/codex-review.md` 已追加 Phase 2 review；未发现高优先级阻塞问题。

- **Phase 3 — Ticket Detail Page**（`/tickets/[id]`）
  - `src/app/tickets/[id]/page.tsx`：Server Component，`params: Promise<{id}>` 并 `await params`；
    `getTicketById` 查不到时渲染友好"未找到工单"组件（非默认 404）；`generateMetadata` 动态标题。
  - `ticket-detail.tsx`（client）：本地 state 管理状态切换与新增备注（仅内存），复用 StatusBadge /
    PriorityBadge / formatDateTime / STATUS_ORDER / CATEGORY_LABELS。
  - `activity-timeline.tsx`：发丝竖线 + 彩色圆点的处理记录时间线，复用 ACTIVITY_TYPE_LABELS。
  - 操作：更改状态（select，追加 status_changed 活动 + 更新 updatedAt）、添加内部备注（追加 note 活动）。
  - 处理 Codex Phase 1 P3：为 TKT-1005 / 1007 / 1008 补齐 open→in_progress 中间状态变更活动。
  - `npm run lint` / `npm run build` 通过；浏览器验证：详情渲染、改状态、加备注、无效 id 友好、无 console 报错。
- **Codex Review — Phase 3**
  - 已 review `/tickets/[id]` route、`ticket-detail.tsx`、`activity-timeline.tsx` 和 mock timeline 补齐。
  - `npm run lint` 与 `npm run build` 均通过；build 输出包含动态路由 `/tickets/[id]`。
  - 浏览器验证通过：详情渲染、动态标题、状态切换、新增备注、无效 id 友好页面、移动端首屏。
  - `docs/codex-review.md` 已追加 Phase 3 review；未发现高优先级阻塞问题。

- **本地化 — 产品 UI 改英文**（决策 D7）
  - mock 工单（标题/描述/活动）、ticket-utils 的 ACTIVITY_TYPE_LABELS 与 formatRelativeTime、
    Dashboard / filters / list / card / detail / `[id]` route / layout metadata、`<html lang="en">`
    全部英文。docs 仍中文（Owner 偏好）。`lint`/`build` 通过。
- **Phase 4 — Create Ticket Page**（`/tickets/new`，英文）
  - `src/app/tickets/new/page.tsx`（client）：受控表单 requesterName / email / title /
    category / priority / description；复用 CATEGORY_/PRIORITY_ ORDER + LABELS。
  - 校验：必填 + 邮箱格式；行内错误（红框 + 字段下方提示）；可访问（label htmlFor、
    aria-invalid、aria-describedby）；编辑字段即清除该项错误。
  - 提交：因无后端/store（不引入 Zustand），采用**原地成功确认**（显示生成 id + 标题 +
    "mock 不持久化" 说明 + Create another / Back to dashboard），而非跳详情页导致 404。
  - 解决 "+ 新建工单" → `/tickets/new` 的 404（Codex Phase 2 P2 剩余一半）。
  - `npm run lint` / `npm run build` 通过；浏览器验证：空提交报错、合法提交成功、无 console 报错。
- **Codex Review — Phase 4**
  - 已 review `/tickets/new` 表单、英文 UI 本地化、D7 决策记录和 mock 提交流程。
  - `npm run lint` 与 `npm run build` 均通过；build 输出包含静态路由 `/tickets/new`。
  - 浏览器验证通过：空提交错误、邮箱格式错误、字段错误清除、合法提交成功、Create another 重置、
    Back to dashboard、移动端首屏。
  - `docs/codex-review.md` 已追加 Phase 4 review；未发现高优先级阻塞问题。

- **Phase 5 — AI Suggested Reply（mock）**
  - `src/lib/reply-templates.ts`：数据驱动方案模板库 `solutionTemplates`（含 .ost 过满、inbox
    访问、Outlook classic 同步三例）+ 纯函数 `matchScore` / `findRelevantTemplates` /
    `generateSuggestedReply`（无真实 LLM）。为后续知识库 / 关键词搜索预留扩展点（决策 D8）。
  - `ai-suggested-reply.tsx`：idle → loading（skeleton）→ generated；可编辑草稿；
    Copy / Insert as reply / Regenerate；醒目 "Suggested draft — review before sending" 标注。
  - 接入 `ticket-detail.tsx`：`handleInsertReply` 复用现有本地 timeline state，追加 reply 活动。
  - 顺带处理 Codex P3：创建页 mock id 改为 timestamp-based；详情 metadata 改为语义 `<dl>`。
  - `npm run lint` / `npm run build` 通过；浏览器验证：生成（Outlook ticket 命中模板）、复制、
    Insert as reply 入时间线、无 console 报错。

- **Enhancement — 详情页 Assignee 可手动选择**（Owner 要求）
  - `ticket-utils.ts` 新增 `TECHNICIANS = ['Kyle','John','Kevin']`（集中、可增减）。
  - `ticket-detail.tsx`：Assignee 从只读改为 `<select>`（Unassigned + 技师；若工单原 assignee
    不在名单内，如 "IT - Daniel"，自动并入选项以反映真实值）；切换时追加一条 note 活动
    "Assigned to X." / "Unassigned." 并更新 metadata。仅内存。
  - `lint` / `build` 通过；浏览器验证：选项正确、切换更新 metadata + 时间线、无 console 报错。
- **Codex Review — Phase 5**
  - 已 review `reply-templates.ts`、`ai-suggested-reply.tsx`、详情页接入、Assignee select 增强。
  - `npm run lint` 与 `npm run build` 均通过；未发现真实 API / env key / 新依赖。
  - 浏览器验证通过：生成草稿、Insert as reply 入 timeline、Assignee 切换、移动端无横向溢出、无 console 报错。
  - `docs/codex-review.md` 已追加 Phase 5 review；未发现高优先级阻塞问题，但有两个 Phase 6 应优先处理的 P2/P3。

- **Phase 6 — Polish, Accessibility, README**
  - 处理 Codex Phase 5 P2（模板匹配过宽）：`matchScore` 只数**具体关键词**命中（category 不再
    自动 +2，移除 `.ost`/`access`/`outlook` 等过泛词），`findRelevantTemplates` 要求 ≥1 命中，
    否则回退 category 级致谢。验证：TKT-1001（登录）、TKT-1005（GitHub）不再误命中。
  - 新增 3 条精准匹配模板的 mock 工单（TKT-1011 .ost 满 / 1012 Outlook classic 不同步 /
    1013 申请 shared mailbox delegate access），让模板库可见地工作（共 13 张）。
  - 处理 Codex Phase 5 P3：复制失败显示 "Copy failed — select & copy manually"。
  - 处理 Codex Phase 2 P3：去重——移除空状态里的 "Clear filters"，仅保留 filter bar 一处。
  - 重写 README：implemented 功能 + mock 限制（不持久、刷新重置、AI 为本地模板）。
  - `npm run lint` / `npm run build` 通过；浏览器全量 smoke（含 mobile 375px 无横向溢出、无 console 报错）。
- **Codex Review — Phase 6**
  - 已 review Phase 6 polish、README、AI 模板匹配、copy 失败反馈、empty state 去重和最终 MVP 范围。
  - `npm run lint` 与 `npm run build` 均通过；未发现真实 API / env key / storage / 新依赖。
  - 浏览器验证通过：Dashboard、筛选无结果、TKT-1001/TKT-1005 fallback、TKT-1011 `.ost` 模板、
    copy failure feedback、Insert as reply、移动端 Dashboard/detail/create 无横向溢出、无 console 报错。
  - `docs/codex-review.md` 已追加 Phase 6 review；未发现需要阻塞 MVP 收尾的代码问题。

- **MVP 六个阶段全部完成**（Definition of Done 已满足，Phase 6 最终 review 已过）。

- **Database Extension — Step 1（Supabase 脚手架）**
  - 加依赖 `@supabase/supabase-js`（决策 D9）。
  - `supabase/schema.sql`（tickets + activities + check 约束 + RLS 开但无 public policy +
    TKT-#### 序列）、`supabase/seed.sql`（由 `scripts/gen-seed.ts` 从 13 条 mock 生成：13 工单 + 31 活动）。
  - `.env.example`、`src/lib/supabase/server.ts`（service-role 懒加载单例，仅服务端）。
  - `docs/db-setup.md`（建库 + 灌种子 + 本地 + Vercel 的手把手指南）、decisions D9/D10。
  - 本步只新增文件、不改读写路径 → 现有 mock 应用照常运行；`build` 通过。

## Next（下一步）
- **Owner 操作**：按 `docs/db-setup.md` 建 Supabase 项目、跑 schema+seed SQL、填 `.env.local`，
  把 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 给 Claude。
- **DB Ext Step 2 — 读迁移**：`tickets-repo` 读函数；`page.tsx` 改 Server Component 读 DB；`[id]` 用 repo。
- **Review Focus**：repo 行↔类型映射正确、service key 不外泄、保留并复用 ticket-utils；
  知识库/关键词搜索仍不在本阶段范围。

## Risks（风险 / 注意）
- Next.js 16：App Router 的 `params` / `searchParams` 是 **Promise**，详情页需 `await`。
- Tailwind v4：CSS-first 配置（`@import "tailwindcss"` + `@theme`），无 `tailwind.config.js`。
- 范围蔓延风险：MVP 已完成；后续不要顺手扩成企业级 helpdesk（无登录、无真实 API、无数据库），除非 Owner 明确开新 scope。
- README 已在 Phase 6 改为 implemented features + mock limitations；后续如果扩 scope，需要同步维护。
- ~~starter `layout.tsx` / `page.tsx`~~：已在 Phase 2 替换为项目真实 metadata 与 Dashboard 首页。
- ~~少数 mock activity 跳过中间状态~~：已在 Phase 3 为 TKT-1005/1007/1008 补齐 open→in_progress。
- `formatRelativeTime()` 默认使用 `Date.now()`；当前页面用 `formatDateTime()`（确定性 UTC 输出），
  新增活动的时间在事件回调里生成（非渲染期），无 hydration 风险。
- ~~ticket card / "+ New ticket" 链接 404~~：详情页（Phase 3）与创建页（Phase 4）均已实现。
- 详情页状态切换 / 新增备注、创建页提交均仅内存，刷新后重置（mock 设计预期，UI 已注明）。
- 创建的工单不会出现在列表/详情里（无共享 store）；这是 mock 限制，成功页与 README 已说明。
- ~~创建页 mock id 随机碰撞风险~~：已在 Phase 5 改成 timestamp-based mock id。
- ~~详情页 metadata 缺少显式 `<dl>`~~：已在 Phase 5 修正。
- ~~筛选无结果时有两个 "Clear filters" 按钮~~：已在 Phase 6 去重。
- ~~AI suggested reply 模板匹配过宽~~：已在 Phase 6 改成具体关键词命中，category 不再自动选模板。
- ~~Copy 失败静默吞掉~~：已在 Phase 6 增加 "Copy failed — select & copy manually" 可见反馈。

## 后续扩展方向（不在 MVP 内）
- 加入 Supabase / Firebase 存储真实 tickets。
- 登录与角色权限：employee / IT support / admin。
- 接入真实 AI API 生成回复、分类和优先级建议。
- 部署到 Vercel。
- **（Owner 提出）关键词搜索以往 ticket**：technician 用 Outlook / email 等关键词找到历史相关工单。
  扩展点已就绪：复用 `reply-templates.ts` 的 `matchScore`，并让 `searchTickets` 也匹配 `description`。
- **（Owner 提出）邮箱问题知识库**：把常见解决方案做成文档（.ost 过满、申请他人 inbox 访问、
  Outlook classic 无法同步等）。`reply-templates.ts` 的 `solutionTemplates` 已作为数据种子，
  后续渲染成独立文章页即可（详见决策 D8）。
