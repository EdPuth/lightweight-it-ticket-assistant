# Decisions — 决策记录

> 每条决策记录：背景、决定、理由、影响。引入新依赖前必须在这里写清楚。

## D1 — UI 用自定义组件 + Tailwind，而非 shadcn/ui
- **背景**：文档建议新手阶段可先用自定义组件，避免一次引入太多依赖。
- **决定**：MVP 阶段用手写组件 + Tailwind v4，不引入 shadcn/ui 或其它 UI 库。
- **理由**：依赖最少、代码最容易被 Codex review、最适合新手理解。
- **影响**：Badge、Card、按钮等需要自己写少量样式；后续如需要可再评估 shadcn/ui。

## D2 — 只用 mock data，不接后端 / 数据库
- **背景**：MVP 目标是练习前端 + agent 协作，不是搭建真实系统。
- **决定**：所有数据来自 `src/lib/mock-tickets.ts`；创建/改状态等操作只更新内存状态。
- **理由**：保持轻量、可离线运行、聚焦前端练习。
- **影响**：刷新页面后数据重置；这是预期行为，需在 README 中说明。

## D3 — AI 建议回复用本地模板，不接真实 LLM API
- **背景**：MVP 不应接入真实 API（成本、密钥、复杂度）。
- **决定**：`generateSuggestedReply(ticket)` 用本地模板根据分类/优先级/描述拼接文本。
- **理由**：可演示交互（loading/生成/复制），又不引入外部依赖与密钥。
- **影响**：回复内容是模板化的；UI 必须明确标注 "AI suggested draft — review before sending"。

## D4 — 技术栈版本：Next.js 16 + React 19 + Tailwind v4
- **背景**：create-next-app 默认使用最新版本。
- **决定**：沿用脚手架默认版本。
- **理由**：使用最新稳定版；练习项目无需锁旧版本。
- **影响 / 注意**：
  - App Router 的 `params` / `searchParams` 是 Promise，动态路由页面需 `await`。
  - Tailwind v4 用 CSS-first 配置，无 `tailwind.config.js`。
  - 写涉及这些点的代码前，参考 `node_modules/next/dist/docs/`。

## D5 — Reviewer 用 Codex 桌面 App
- **背景**：用户用 Codex 桌面 App 做 review，本机未装 Codex CLI。
- **决定**：交接通过 Git diff / 在 App 里打开仓库；review prompt 存于
  `docs/prompts/codex-review-prompt.md`。
- **理由**：两个 agent 不互相自动调用，靠文件 + commit 交接更稳定可控。
- **影响**：每个阶段一个 commit，作为 Codex review 的清晰边界。

## D6 — UI 设计语言：refined minimal / editorial（Typora 风格）
- **背景**：Owner 在 Phase 2 前给出设计方向——简洁、白色基调、工单像一张张卡片"浮现"、参考 Typora。
- **决定**：
  - 暖白页面底色（`#f7f7f5`）+ 纯白卡片，卡片带发丝边 + 极轻阴影，hover 时微微上浮（浮现感）。
  - 通篇近乎单色（墨黑 + 暖灰），**唯一彩色是状态/优先级圆点**；主操作按钮用墨黑而非渐变。
  - 字体：标题/数字用 Fraunces（衬线），正文用 Hanken Grotesk，工单 ID 用 JetBrains Mono；
    经 next/font 引入（非 npm 依赖），中文回退 PingFang / 系统字体。
  - 固定白色主题，移除 starter 的 dark-mode 自动切换。
- **理由**：贴合 Owner 的 Typora 审美；克制单色 + 留白让信息清晰、易 review。
- **影响**：颜色 token 与字体集中在 `globals.css` 的 `@theme`；圆点配色集中在 `ticket-utils.ts`
  的 `STATUS_DOT_CLASS` / `PRIORITY_DOT_CLASS`，组件不各自硬编码。后续页面沿用这套语言。

## D7 — 产品 UI 语言改为英文
- **背景**：Owner 在 Phase 4 前明确这个系统面向英语用户，要求把界面元素都改成英文。
- **决定**：
  - 所有**用户可见文案**改为英文：mock 工单标题/描述/活动记录、各页面文案、表单 label、占位符、
    空状态、徽标/活动类型 label、相对时间文案、metadata、`<html lang="en">`。
  - 状态/优先级/分类 label 本就是英文，保持不变。
  - **内部文档**（`docs/*`、tasks/decisions/codex-review）与 Owner 沟通**仍用中文**（Owner 偏好）。
  - 代码注释为降低改动面暂保留中文；Phase 4 起新写代码的注释用英文。
- **理由**：产品受众是英语用户；文档受众是 Owner（偏好中文），两者分开处理最合理。
- **影响**：本地化作为 Phase 4 前的独立 commit；之后所有新 UI 一律英文。

## D8 — AI 建议回复用「数据驱动的方案模板库」，为后续功能预留扩展点
- **背景**：Phase 5 做 mock AI 回复；同时 Owner 提到后续想加两个功能：
  (1) technician 用关键词（如 Outlook、email）搜索以往处理过的相关 ticket；
  (2) 一个常见邮箱问题的解决方案知识库（如 .ost 过满、申请他人 inbox 访问、Outlook classic 无法同步）。
  Owner 明确**现在不实现**，但希望代码保持灵活、以后好加。
- **决定**：
  - 把可复用内容沉淀到 `src/lib/reply-templates.ts` 的 `solutionTemplates`（`{ id, title,
    category, keywords[], body }` 列表），已预置上述三个邮箱方案。
  - 暴露纯函数 `matchScore(template, ticket)` 与 `findRelevantTemplates(ticket)`（按 category +
    keyword 命中打分排序），`generateSuggestedReply(ticket)` 基于它们组合草稿；无真实 LLM。
- **理由**：这三者形状一致——AI 回复、关键词搜索、知识库都依赖"按关键词/类别匹配文本"。统一成
  一份数据 + 一个打分函数，后续功能就是"加数据 + 加页面"，不用重构。
- **影响 / 扩展路径**：
  - 知识库功能：直接把 `solutionTemplates` 渲染成独立文章页即可，数据已就绪。
  - 关键词搜索：复用 `matchScore` / `findRelevantTemplates`；若要搜 ticket 正文，扩展
    `ticket-utils.ts` 的 `searchTickets` 让它也匹配 `description`（当前仅 id/title/requester/email）。
  - 真实 LLM：把 `generateSuggestedReply` 内部换成 API 调用即可，签名 `(ticket) => string` 不变
    （改 async）；组件状态机（idle/loading/generated）已适配异步。

## D9 — 引入依赖 `@supabase/supabase-js`（Database Extension 阶段）
- **背景**：Owner 要把工单从内存 mock 迁到真实数据库做持久化存储与检索。
- **决定**：选 **Supabase（托管 PostgreSQL）**，引入官方客户端 `@supabase/supabase-js`。
- **替代方案**：
  - Firebase（Firestore，NoSQL）——数据是关系型（ticket 一对多 activity），文档型查询/搜索更别扭。
  - Prisma + 自管 Postgres——更重，要自己搭/运维数据库，不适合轻量练习。
  - 直接用 `pg` 驱动写 SQL——可行但要手写连接/查询封装；Supabase 客户端 + 托管库更省事。
- **理由**：关系型契合现有类型、SQL 检索自然、托管免运维、与 Next.js/Vercel 集成好、免费额度够练习。
- **影响**：新增一个运行时依赖；需要 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 两个环境变量。

## D10 — 数据库架构：service-role server-only + repo + Server Actions
- **背景**：在 Next.js 16 App Router 下安全地读写 Supabase。
- **决定**：
  - 所有 DB 访问走**服务端**：Server Components 读、Server Actions 写。
  - 用 **service_role** 密钥（`src/lib/supabase/server.ts` 懒加载单例），**仅服务端**、不加 `NEXT_PUBLIC_`。
  - 数据访问集中在 `src/lib/tickets-repo.ts`（行 snake_case ↔ 类型 camelCase 映射）；
    `Ticket`/`TicketActivity` 类型与展示/筛选纯函数（`ticket-utils.ts`）保持不变、继续复用。
  - 开启 RLS 但不加 public policy → service_role 绕过、anon 无法访问。
- **理由**：服务端持密钥最简单安全；repo 层让组件改动最小、易 review；类型不变保护既有代码。
- **影响 / 注意**：现阶段**无登录**，任何访问者可读写（practice/演示用）。生产化需 Supabase Auth +
  RLS policies + anon key，列入后续方向。`mock-tickets.ts` 保留为种子来源（`scripts/gen-seed.ts`）。

## D11 — Server Actions 加无依赖 runtime validation（接手后第一阶段）
- **背景**：Codex 在 Database Extension review 提出 [P2]——Server Actions 在运行时是公开 endpoint，
  目前只靠客户端校验和 TS 类型。直接调用可绕过校验、传超长字符串、或传非法 enum / 错误 `prev`
  让活动文案不准。另外 [P3]——`insertActivity()` 的 `updated_at` 更新错误被静默忽略。
- **决定**：
  - 新增 `src/lib/validation.ts`（**无新依赖**，不引入 Zod）：复用 `ticket-utils.ts` 的
    `STATUS_ORDER` / `PRIORITY_ORDER` / `CATEGORY_ORDER` 做枚举校验；提供 `validateCreateTicketInput`
    / `validateStatus` / `validateAssignee` / `validateNoteContent` / `validateTicketId`，
    统一 trim + 非空 + 长度上限（`LIMITS`），非法输入抛 `ValidationError`。
  - `src/app/actions.ts` 五个 Action 入口都先校验再落库；空/无变化仍按原逻辑提前返回（客户端已有
    button disabled 守卫，正常 UX 不变，只有绕过客户端的滥用路径会被拦）。
  - `src/lib/tickets-repo.ts` 的 `insertActivity()` 现在检查 `updated_at` 更新的 `{ error }` 并抛错。
- **替代方案**：引入 Zod 做 schema 校验——更声明式，但多一个依赖；Owner 选择保持无依赖（见本次决策）。
- **理由**：CLAUDE.md 要求不随意加依赖；校验规则简单、复用现有联合常量即可，手写更轻、易 review。
- **影响**：纯加固，不改数据模型 / UI / 现有正常流程。Auth/RLS（把公开无登录写入收口）仍是独立的
  后续 scope（需 Owner 开），不在本阶段。

## D12 — 全站登录门禁：单账号 + cookie session + proxy（Owner 要求）
- **背景**：Owner 希望"只有登录后才能看到 ticket system"，且只允许一个账号：
  `itsupport@outlook.com` / `123456`，没有别的账号。登录页设计要与现有 Typora 风格一致、带点特效。
- **决定**（**练习级，非生产 auth**）：
  - `src/lib/auth.ts`：单账号凭据 + session 常量 + `verifyCredentials` / `isValidSession`。
    凭据与 session token **仅服务端读**（登录 Action 与 proxy），不进客户端 bundle；可用
    `AUTH_EMAIL` / `AUTH_PASSWORD` / `AUTH_SESSION_TOKEN` 环境变量覆盖。
  - `src/app/login/actions.ts`：`loginAction`（校验 → 设 httpOnly session cookie → redirect `/`）
    + `logoutAction`（删 cookie → redirect `/login`）。
  - `src/proxy.ts`：**Next.js 16 把 middleware 改名为 proxy**（`proxy.ts`，导出 `proxy` 函数 +
    `config.matcher`）。未登录访问非 `/login` 路径 → 跳 `/login`；已登录访问 `/login` → 跳 `/`。
  - 登录页 `src/app/login/page.tsx` + `src/components/login-form.tsx`（`useActionState`）：
    沿用暖白 + 浮起卡片 + Fraunces 衬线；特效保持克制——状态四圆点 motif 依次脉冲、两团极淡的
    蓝/琥珀 aura 缓慢漂移、淡点阵网格；均遵循 `prefers-reduced-motion`。
  - Dashboard 顶部加 "Signed in as … / Sign out"（`src/components/logout-button.tsx`）。
- **替代方案**：Supabase Auth + RLS + anon key（真正的 per-user 认证）——是后续生产化方向，
  本次按 Owner 要求只做单账号门禁，范围更小。
- **理由 / 局限**：单账号共享凭据、session cookie 是固定不签名 token、DB 写仍用 service-role
  （门禁是应用层不是数据库层）。满足"登录才可见"的练习需求，但**不是**生产安全模型。
- **影响**：新增 `proxy.ts`（全站门禁）；无新依赖。Codex DB review 的 [P2 公开无登录写入] 在
  应用层被收口（仍非 RLS）。生产化下一步仍是 Supabase Auth + RLS（见 D10）。
