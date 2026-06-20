# 项目交接文档（Handoff）

> 给接手这个项目的 agent / 协作者。读完这份你应该能理解：项目是什么、怎么一步步做到现在、
> 当前状态、代码在哪、以及接下来可以做什么。配套细节见 `docs/` 下其它文件（文末有索引）。

---

## 1. 项目是什么

**Lightweight IT Support Ticket Assistant** —— 一个轻量的 IT 支持工单管理 Web App（最初是新手
练习项目）。模拟小型公司 IT Support 团队处理员工请求：查看工单统计、筛选/搜索、看详情与处理记录、
创建工单、生成一段 mock AI 建议回复。**现已接入真实数据库并部署上线。**

- GitHub（私有）：`EdPuth/lightweight-it-ticket-assistant`
- 线上：https://lightweight-it-ticket-assistant.vercel.app
- 默认分支：`main`（每个阶段一个 commit）

## 2. 协作模式（重要）

三方分工，**两个 agent 不互相自动调用**，通过 Git + `docs/` 文件交接：
- **Claude Code** = 前端设计 + 实现（写代码、维护 `CLAUDE.md`、`docs/tasks.md`）。
- **Codex（Owner 在 Codex 桌面 App 里跑）** = code review + 项目管理，产出写进 `docs/codex-review.md`。
- **Owner** = 决策、运行项目、触发 Codex review、建 Supabase/Vercel、给密钥。

每个阶段节奏：Claude 写小计划 → 实现 → `npm run lint` + `npm run build` → 更新 `docs/tasks.md`
→ commit → Owner 跑 Codex review → 采纳意见 → 下一阶段。**规矩见 `CLAUDE.md` / `AGENTS.md`。**

## 3. 技术栈与架构（当前）

- Next.js 16（App Router，Server Components + Server Actions）+ React 19 + TypeScript
- Tailwind CSS v4（CSS-first，无 `tailwind.config.js`）+ 自定义组件（不用 UI 库）
- **Supabase（PostgreSQL）** 存储；`@supabase/supabase-js`
- 设计语言：refined minimal / editorial（**Typora 风格**）—— 暖白底 + 纯白浮起卡片、近乎单色、
  状态圆点是唯一彩色；字体 Fraunces（衬线标题/数字）/ Hanken Grotesk（正文）/ JetBrains Mono（ID）。

**数据流（接库后）：**
```
.env.local (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY，Next 自动加载)
   → src/lib/supabase/server.ts   (service-role 客户端，仅服务端，懒加载单例)
   → src/lib/tickets-repo.ts      (读/写，行 snake_case ↔ 类型 camelCase 映射)
   → 读：Server Components (app/page.tsx, app/tickets/[id]/page.tsx，均 force-dynamic)
     写：Server Actions (app/actions.ts)，每个 revalidatePath；create 后 redirect
```
安全模型：service_role key **仅服务端用、不加 `NEXT_PUBLIC_`**；RLS 开启但无 public policy
（anon 进不来，service role 绕过）。**目前无登录**——线上公开可读写（practice 级）。

## 4. 关键 Next.js 16 注意点（容易踩坑）

- 动态路由 `params` / `searchParams` 是 **Promise**，必须 `await`（见 `app/tickets/[id]/page.tsx`）。
- Tailwind v4 用 `@import "tailwindcss"` + `@theme`（见 `app/globals.css`）。
- 详情页用 `useTransition` + `useOptimistic` 做乐观 UI；**不要**用 `useEffect` + `setState` 同步 props
  （会被 `react-hooks/set-state-in-effect` lint 拦），这是当时踩过的坑。

## 5. 逐阶段做了什么（Phase 1 → 数据库）

> Phase 0（脚手架 + 全部 docs）在更早，略。以下按时间顺序。

- **Phase 1 — 数据模型 + mock**：`src/lib/types.ts`（Ticket/TicketActivity + 字面量联合类型）、
  `src/lib/mock-tickets.ts`（多样化工单）、`src/lib/ticket-utils.ts`（纯函数：搜索/筛选/统计/排序、
  确定性日期格式化、label 与圆点配色映射、顺序数组）。
- **Phase 2 — Dashboard + 列表**：确立 Typora 设计语言（决策 D6）。组件 `status-badge` /
  `priority-badge` / `stat-card`（点击=状态筛选）/ `ticket-filters`（搜索+优先级+清除）/ `ticket-card`
  （浮起卡片）/ `ticket-list`（两种空状态）。首页 client 组件做筛选/搜索/排序。
  - **Phase 2 打磨**：hover 丝滑抬升（cubic-bezier）+ 卡片"逐个浮现"入场动画（`.rise`，分层避免
    动画 fill 顶掉 hover）；尊重 `prefers-reduced-motion`。
- **Phase 3 — 工单详情**：`app/tickets/[id]/page.tsx`（Server Component，`await params`，无效 id 友好
  "未找到"页）、`ticket-detail.tsx`、`activity-timeline.tsx`；改状态 / 加备注（当时是内存态）。
- **本地化 → 英文（决策 D7）**：所有用户可见文案改英文（产品面向英语用户）；`docs/` 仍中文（Owner 偏好）。
- **Phase 4 — 创建工单**：`app/tickets/new/page.tsx` 受控表单 + 校验（必填、邮箱格式、行内错误、a11y）。
- **Phase 5 — AI 建议回复（mock，无真实 LLM）**：`src/lib/reply-templates.ts`——数据驱动的"方案模板库"
  `solutionTemplates`（已含 .ost 满 / inbox 访问 / Outlook classic 同步三例）+ 纯函数
  `matchScore` / `findRelevantTemplates` / `generateSuggestedReply`；`ai-suggested-reply.tsx`
  （idle→loading→generated，Copy/Insert/Regenerate，明确标注 draft）。**为后续知识库 + 关键词搜索
  预留扩展点（决策 D8）。**
- **增强 — Assignee 可选**：`ticket-utils.ts` 加 `TECHNICIANS = ['Kyle','John','Kevin']`；详情页
  Assignee 改为下拉可选。
- **Phase 6 — 打磨 + 收尾**：收紧 AI 模板匹配（只数具体关键词命中，去掉过泛词，避免误命中）；新增
  3 条精准匹配模板的 mock 工单（TKT-1011/1012/1013，共 13 条）；Copy 失败可见反馈；去重重复的
  "Clear filters"；重写 README。MVP 六阶段在此收尾。
- **Database Extension（4 步）—— 接 Supabase + 部署：**
  1. **脚手架**：加 `@supabase/supabase-js`（D9）；`supabase/schema.sql`（tickets + activities +
     check 约束 + TKT-#### 序列 + RLS）、`supabase/seed.sql`（由 `scripts/gen-seed.ts` 从 mock 生成）、
     `.env.example`、`src/lib/supabase/server.ts`、`docs/db-setup.md`、决策 D9/D10。
  2. **读迁移**：`src/lib/tickets-repo.ts` 读函数；`app/page.tsx` 改 Server Component 读 DB，
     筛选 UI 抽到 `src/components/dashboard-client.tsx`；`[id]` 用 repo。
  3. **写迁移**：`app/actions.ts` 五个 Server Actions（create / changeStatus / assign / addNote /
     insertReply）+ repo 写函数；详情页改调 actions（`useTransition`/`useOptimistic`）；创建表单落库
     + redirect 到新工单。**改状态/备注/创建等现在刷新后仍在 = 真持久化。**
  4. **部署**：Vercel 导入仓库 + 配两个环境变量；线上验证读写均通（线上创建了 TKT-1015）。README 更新。

## 6. 当前状态（截至交接）

- ✅ 本地 `npm run dev` 与线上 Vercel **都连同一个 Supabase 库**，读写持久化。
- ✅ `npm run lint` / `npm run build` 通过；MVP 六阶段 + 英文化 + DB 接入 + 部署全部完成。
- 数据库现有约 14 条工单（13 条种子 + Owner 在线上测试创建的 `TKT-1015 "asd"`，可删）。
- **Codex 已 review 全部阶段，含 Database Extension（2026-06-20）**：无阻塞练习项目的问题，但提出了
  安全 / 校验类待办 —— 见第 9 节（也是接手后建议先处理的）。

## 7. 代码地图（去哪找）

| 关注点 | 位置 |
|---|---|
| 类型 | `src/lib/types.ts` |
| 展示/筛选纯函数、label、圆点配色、TECHNICIANS | `src/lib/ticket-utils.ts` |
| mock（现为 DB 种子来源） | `src/lib/mock-tickets.ts` + `scripts/gen-seed.ts` |
| AI 回复模板库 + 匹配 | `src/lib/reply-templates.ts` |
| DB 客户端 / 数据访问层 | `src/lib/supabase/server.ts` / `src/lib/tickets-repo.ts` |
| 写操作（Server Actions） | `src/app/actions.ts` |
| 页面 | `src/app/page.tsx`、`src/app/tickets/[id]/page.tsx`、`src/app/tickets/new/page.tsx` |
| 组件 | `src/components/*` |
| 数据库 SQL | `supabase/schema.sql`、`supabase/seed.sql` |
| 建库/部署指南 | `docs/db-setup.md` |

## 8. 怎么跑起来

1. 需要一个 Supabase 项目；按 `docs/db-setup.md` 建库、跑 `schema.sql` + `seed.sql`。
2. `cp .env.example .env.local`，填 `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`（service/secret key）。
3. `npm install && npm run dev` → http://localhost:3000。
4. 提交前门槛：`npm run lint` 和 `npm run build` 必须过。
5. 调试连库可用 `node --env-file=.env.local scripts/db-check.ts`。

## 9. Codex DB-阶段 review 结论 + 下一步（2026-06-20）

Codex 已 review 整个 Database Extension：架构清晰、service-role 仅服务端、schema/RLS 基础到位，
**无阻塞练习项目的问题**。但上线后重点从"组件结构"转向"安全与范围"。原文见
`docs/codex-review.md` 最后一节「Database Extension — Supabase + Vercel」。

### 9a. 待修问题（按优先级，接手后建议先做前两条）

- **[P2 安全] 公开无登录 + 持久化写入**：任何能打开 Vercel URL 的人都能创建/改状态/指派/加备注。
  **务必不要放真实数据。** 若长期公开，下一个真实 scope = Supabase Auth + RLS policies + anon key。
- **[P2] Server Actions 缺服务端校验**：`src/app/actions.ts` 在运行时是公开 endpoint，目前只靠
  客户端校验和 TS 类型。直接调用可绕过校验、传超长字符串、或传错误的 `prev` 值让活动文案不准。
  **需补 runtime validation**（create / status / assignee / note / reply）——尽量复用现有联合常量、
  保持无依赖；如要用 Zod 等小库须先经 Owner 同意。
- **[P3] `insertActivity()` 未检查 `updated_at` 更新错误**：`src/lib/tickets-repo.ts` 里 activity
  插入检查了 `error`，但随后的 `tickets.update({ updated_at })` 没看 `{ error }`——失败会让排序/新鲜度
  时间静默过期。应检查并抛错。
- **[P3] Dashboard 把完整 ticket 下发到 client**：`listTickets()` 含 description / email / activities
  全量传给 `DashboardClient`。公开 demo 可接受；若以后接真实/私有数据，应为列表行做轻量 list DTO。
- **[已修] README 旧措辞**：Codex 本轮已把 README 更新为 Supabase persistence + Vercel 部署。

### 9b. Codex 给的 Next Actions（短期，可直接做）

1. 给所有 Server Actions 加 runtime validation（复用现有联合常量/label，保持无依赖，除非 Owner 同意小库）。
2. `insertActivity()` 里检查并在 `updated_at` 更新出错时抛错。
3. 若要往"接近生产"走，**先单独排一个 Auth/RLS 阶段**，再做关键词搜索或真实 AI。

### 9c. 后续功能方向（需 Owner 开新 scope）

- **Auth/RLS 阶段**（建议优先于下面两项）：Supabase Auth + RLS policies + anon key，把无登录公开写入收口。
- **关键词搜索历史工单**（Owner 想要）：复用 `reply-templates.ts` 的 `matchScore`；让
  `ticket-utils.ts` 的 `searchTickets` 也匹配 `description`（当前只搜 id/title/requester/email）。
- **邮箱问题知识库**（Owner 想要）：`solutionTemplates` 已是数据种子，渲染成文章页即可（决策 D8）。
- AI 回复仍是本地模板；接真实 LLM 只需替换 `generateSuggestedReply` 内部（签名/状态机已适配异步）。

## 10. docs 索引

- `docs/project-brief.md` —— MVP 范围 + 数据模型 + Definition of Done。
- `docs/frontend-spec.md` —— 页面与功能规格。
- `docs/tasks.md` —— 阶段清单：Completed / Next / Risks（**进度真相在这**）。
- `docs/decisions.md` —— 决策记录 D1–D10（设计语言、英文化、AI 模板架构、依赖、DB 架构等）。
- `docs/codex-review.md` —— Codex 历次 review。
- `docs/db-setup.md` —— Supabase + Vercel 手把手。
- `docs/prompts/` —— 给两个 agent 复用的 prompt。
- `CLAUDE.md` / `AGENTS.md` —— 两个 agent 各自的角色与规则。
