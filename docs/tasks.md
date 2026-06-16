# Tasks — 阶段清单与进度

> 每完成一个阶段，更新本文件的 Completed / Next / Risks 三节。

## 阶段总览

| 阶段 | 任务 | 验收标准 | 状态 |
|---|---|---|---|
| Phase 0 | 初始化 Next.js；创建 README/CLAUDE.md/AGENTS.md/docs/* | `npm run dev` 可运行；docs 存在；范围清晰 | ✅ 完成 |
| Phase 1 | Ticket 类型、mock 数据、ticket utils | 页面可读 mock data；不滥用 any | ⬜ 待开始 |
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

## Next（下一步）
- **Phase 1 — Data Model**
  - `src/lib/types.ts`：Ticket / TicketActivity 及枚举类型。
  - `src/lib/mock-tickets.ts`：8–12 条多样化 mock 工单。
  - `src/lib/ticket-utils.ts`：getById / filterTickets / searchTickets / countByStatus /
    badge 颜色映射 / 日期格式化。

## Risks（风险 / 注意）
- Next.js 16：App Router 的 `params` / `searchParams` 是 **Promise**，详情页需 `await`。
- Tailwind v4：CSS-first 配置（`@import "tailwindcss"` + `@theme`），无 `tailwind.config.js`。
- 范围蔓延风险：避免把 MVP 做成企业级 helpdesk（无登录、无真实 API、无数据库）。

## 后续扩展方向（不在 MVP 内）
- 加入 Supabase / Firebase 存储真实 tickets。
- 登录与角色权限：employee / IT support / admin。
- 接入真实 AI API 生成回复、分类和优先级建议。
- 部署到 Vercel。
