# Tasks — 阶段清单与进度

> 每完成一个阶段，更新本文件的 Completed / Next / Risks 三节。

## 阶段总览

| 阶段 | 任务 | 验收标准 | 状态 |
|---|---|---|---|
| Phase 0 | 初始化 Next.js；创建 README/CLAUDE.md/AGENTS.md/docs/* | `npm run dev` 可运行；docs 存在；范围清晰 | ✅ 完成 |
| Phase 1 | Ticket 类型、mock 数据、ticket utils | 页面可读 mock data；不滥用 any | ✅ 完成 |
| Phase 2 | Dashboard 统计、筛选、搜索、列表 | 可按状态/优先级筛选；搜索可用；空状态可用 | ⬜ 待开始 |
| Phase 3 | `/tickets/[id]`、timeline、status badge | 点击可进详情；无效 id 友好提示 | ⬜ 待开始 |
| Phase 4 | `/tickets/new` 表单 + 校验 | 字段清楚；校验可用；mock 提交 | ⬜ 待开始 |
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

## Next（下一步）
- **Phase 2 — Dashboard & Ticket List**
  - 组件：`ticket-card.tsx`、`ticket-list.tsx`、`ticket-filters.tsx`，
    以及 StatusBadge / PriorityBadge / StatCard 小组件。
  - `src/app/page.tsx`：用 `useState`/`useMemo` 接入 mock 数据；顶部统计卡片
    （countByStatus）、搜索 + 状态/优先级筛选（applyTicketFilters）、工单列表。
  - 空状态 + 筛选无结果时的 "Clear filters" 按钮。
  - 顺带替换 starter 的 `layout.tsx` metadata 与首页内容（Codex P3 提示）。
- **Phase 2 Review Focus**
  - 组件清晰、beginner-friendly；颜色仍只从 `ticket-utils.ts` 引用，不在组件里硬编码。
  - 空 / 筛选无结果状态可用；保持仅前端、无新依赖。

## Risks（风险 / 注意）
- Next.js 16：App Router 的 `params` / `searchParams` 是 **Promise**，详情页需 `await`。
- Tailwind v4：CSS-first 配置（`@import "tailwindcss"` + `@theme`），无 `tailwind.config.js`。
- 范围蔓延风险：避免把 MVP 做成企业级 helpdesk（无登录、无真实 API、无数据库）。
- README 当前描述的是目标 MVP 功能，不是已完成功能；后续阶段需要逐步更新，或在 Phase 6 明确区分
  planned / implemented。
- `src/app/layout.tsx` 和 `src/app/page.tsx` 仍是 create-next-app starter 内容；这不阻塞 Phase 1，
  但进入 Dashboard 阶段时应替换为项目真实 metadata 和首页。

## 后续扩展方向（不在 MVP 内）
- 加入 Supabase / Firebase 存储真实 tickets。
- 登录与角色权限：employee / IT support / admin。
- 接入真实 AI API 生成回复、分类和优先级建议。
- 部署到 Vercel。
