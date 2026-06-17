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
| Phase 5 | mock AI suggested reply | loading/生成/复制状态；标注 suggested draft | ⬜ 待开始 |
| Phase 6 | responsive、a11y、README、review notes | 本地运行正常；docs 记录下一步 | ⬜ 待开始 |

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

## Next（下一步）
- **Phase 5 — AI Suggested Reply（mock）**
  - 详情页加 `ai-suggested-reply.tsx`；`generateSuggestedReply(ticket)` 本地模板（不接真实 LLM）。
  - 状态 idle → loading（skeleton/文字）→ generated；Copy / Insert as reply 按钮；
    明显标注 "AI suggested draft — review before sending"。
  - "Insert as reply" 可把草稿作为一条 reply 活动加入时间线（内存）。
- **Phase 5 Review Focus**
  - mock 诚实标注、无真实 API 代码；loading/生成/复制状态可用；不破坏详情页现有逻辑。

## Risks（风险 / 注意）
- Next.js 16：App Router 的 `params` / `searchParams` 是 **Promise**，详情页需 `await`。
- Tailwind v4：CSS-first 配置（`@import "tailwindcss"` + `@theme`），无 `tailwind.config.js`。
- 范围蔓延风险：避免把 MVP 做成企业级 helpdesk（无登录、无真实 API、无数据库）。
- README 当前描述的是目标 MVP 功能，不是已完成功能；后续阶段需要逐步更新，或在 Phase 6 明确区分
  planned / implemented。
- ~~starter `layout.tsx` / `page.tsx`~~：已在 Phase 2 替换为项目真实 metadata 与 Dashboard 首页。
- ~~少数 mock activity 跳过中间状态~~：已在 Phase 3 为 TKT-1005/1007/1008 补齐 open→in_progress。
- `formatRelativeTime()` 默认使用 `Date.now()`；当前页面用 `formatDateTime()`（确定性 UTC 输出），
  新增活动的时间在事件回调里生成（非渲染期），无 hydration 风险。
- ~~ticket card / "+ New ticket" 链接 404~~：详情页（Phase 3）与创建页（Phase 4）均已实现。
- 详情页状态切换 / 新增备注、创建页提交均仅内存，刷新后重置（mock 设计预期，UI 已注明）。
- 创建的工单不会出现在列表/详情里（无共享 store）；这是 mock 限制，成功页已说明。Phase 6 可在
  README 的 limitations 里写清楚。
- 详情页 metadata 字段使用 `dt` / `dd`，但外层当前不是显式 `<dl>`；功能不受影响，后续若改动详情页
  可顺手调整语义结构。
- 筛选无结果时页面有两个"清除筛选"按钮（filter bar 与 empty state 各一个）；功能正常，Phase 6
  可按视觉/交互偏好决定是否保留。

## 后续扩展方向（不在 MVP 内）
- 加入 Supabase / Firebase 存储真实 tickets。
- 登录与角色权限：employee / IT support / admin。
- 接入真实 AI API 生成回复、分类和优先级建议。
- 部署到 Vercel。
