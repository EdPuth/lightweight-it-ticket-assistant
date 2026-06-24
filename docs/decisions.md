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

## D13 — Ticket 生命周期（closed 状态 + active-only Dashboard）+ 删除 + 登录门禁加固
- **背景**：Owner 要求"能删除 ticket"且"按状态查看 ticket，而不是全部堆在 Dashboard"。Codex 在
  「Hardening + Login Gate」review 提出：先修门禁安全（默认 token 可伪造、Server Actions 未在
  action 内验 session、`changeStatusAction` 仍信任客户端 `prev`），再做删除。本阶段按 Codex 顺序：
  **先加固安全 → 再加 closed/筛选 → 最后删除**。
- **决定**：
  - **安全（先做）**：
    - `src/lib/auth.ts`：production 必须提供 `AUTH_SESSION_TOKEN`，否则启动即抛错；dev 用
      `itsa.session.v1.dev-only` 仅本地回退，源码默认 token 不再能在生产伪造 session。
    - 新增 `src/lib/session.ts` 的 `requireSession()`，在**每个**写操作 Server Action 开头调用
      （create / changeStatus / assign / addNote / insertReply / delete）；不再只靠 `proxy.ts`。
    - `changeStatusAction` / `assignAction` 改为**服务端从 DB 读当前值**（`getTicketFields`），
      不再信任客户端传入的 `prev`，timeline 文案无法被伪造；签名简化为 `(ticketId, next)`。
  - **生命周期 / 按状态查看**：
    - 新增 `closed` 状态（types / `ticket-utils` labels·dot·order·count / SQL check / 详情 select）。
      语义：`resolved` = 已解决保留可查，`closed` = 关闭归档但保留历史。
    - `ACTIVE_STATUSES = open/in_progress/waiting`；Dashboard 默认只显示 active，`resolved`/`closed`
      需点对应状态卡片显式筛选才出现；结果行注明"active tickets"+ 隐藏数量提示，避免误以为没数据。
    - 统计卡片改 5 张（`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`），计数基于全部工单。
  - **删除**：`deleteTicketAction`（requireSession + 校验 + `deleteTicket` + revalidate + redirect `/`）；
    `src/lib/tickets-repo.ts` 的 `deleteTicket` 走 hard delete，activities 由 DB `on delete cascade`
    清除（与 tasks.md 计划一致，优先 hard delete，审计需求以后再做 soft delete）；UI 为详情页底部
    红色 danger 区 + 二次确认（`src/components/delete-ticket.tsx`）。
- **替代方案**：soft delete（保留审计）——本阶段先 hard delete 更简单；以后要审计再改。
- **影响 / 必须的运维动作**：
  - 现有 Supabase 库需跑一次 `supabase/migration-2026-06-21-add-closed-status.sql` 才允许 `closed`
    （否则把工单改成 Closed 会被旧 check 约束拒绝）。本地只有 PostgREST key、无法跑 DDL，需 Owner 在
    Supabase SQL Editor 执行。
  - Vercel 生产环境**必须**设 `AUTH_SESSION_TOKEN`（强随机），否则部署后运行时会抛错。可选设
    `AUTH_EMAIL` / `AUTH_PASSWORD`。`.env.example` 已补说明。
- **仍未做（后续 scope）**：per-user auth / RLS（替换单账号门禁）；Dashboard list DTO（[P3]）。

## D14 — 下一阶段改为 RBAC Auth v1（多账号 + Employee / IT Support / Admin）
- **背景**：Owner 决定暂缓 Email Intake，下一阶段先实现多个不同账户登录系统的权限模型。当前单账号
  cookie 门禁只能证明"登录后可见"，不能表达"谁能看哪些 ticket / 谁能删除"。
- **决定**：
  - 下一阶段命名为 **RBAC Auth v1**。
  - 用 Supabase Auth 替换当前单账号共享 cookie demo；建议按 Supabase SSR 文档使用官方
    `@supabase/ssr` helper 处理 Next.js Server Components / Server Actions 的 cookie session。
  - 角色固定为 `employee` / `it_support` / `admin`，v1 不做自定义角色管理 UI。
  - 新增 app 侧 profile/role 表（例如 `profiles`），不要直接修改 `auth.users` 存业务字段。
  - 给 `tickets` 增加稳定 owner 字段（例如 `requester_user_id uuid references auth.users(id)`）；
    `requester_name` / `requester_email` 只作为展示字段，不作为权限边界。
- **权限矩阵**：
  - Employee：只能创建自己的 ticket；只能看自己创建的 ticket、状态、IT 回复；不能改状态、指派、备注、
    回复或删除。
  - IT Support：能看全部 ticket；能创建 ticket、回复、加内部备注、指派、改状态；不能删除。
  - Admin：能看全部 ticket；拥有所有操作，包括删除。
- **实现原则**：
  - 先做服务端权限检查和数据过滤，再做 UI 隐藏/禁用。UI 不是权限边界。
  - Server Actions 必须逐个按角色检查；不能只依赖页面是否渲染按钮。
  - 当前 `SUPABASE_SERVICE_ROLE_KEY` 会绕过 RLS。RBAC 阶段要么迁到用户态 Supabase client + RLS，
    要么在继续使用 service-role 的地方补显式 server-side role check；长期方向是 Supabase Auth + RLS。
  - RLS policy 相关列需要索引，例如 `tickets.requester_user_id`。
- **暂不做**：Email Intake、团队/部门、多租户、邀请 flow、自定义角色管理、附件、审计日志系统。

## D14 — RBAC Auth v1：Supabase Auth + 三角色 + 应用层强制（Owner 开新 scope）
- **背景**：Owner 决定把单账号门禁升级为多账号 + 角色权限（见 `docs/project-brief.md`、Codex
  「Scope Change — RBAC Auth v1 Planning」）。角色固定：`employee` / `it_support` / `admin`。
- **Owner 拍板的四个关键选择**：
  1. **认证机制 = Supabase Auth + `@supabase/ssr`**（替换原单账号 cookie 门禁；新增官方小依赖）。
  2. **权限强制 = 应用层先行**：每个 Server Action / Server Component 做 `requireRole` + 所有权
     检查，数据访问仍用 service-role；**RLS policies 作为紧随其后的 follow-up**（Codex 明确允许
     "service-role + 显式服务端角色检查"）。
  3. **账号 = 种 3 个固定测试账号**（每角色一个），v1 不做注册页。
  4. **旧工单 = 全部回填给种子 employee**（`requester_user_id`），让 employee 视角有数据。
- **权限矩阵**（来自 Codex / project-brief）：employee = 只看/建自己的工单（不能处理）；
  it_support = 看/处理全部（不能删）；admin = 全部含删除。
- **架构**：
  - 依赖：新增 `@supabase/ssr`（D9 之外的第二个运行时依赖；理由：App Router 下安全管理 auth
    cookie 的官方方案）。新增 env `SUPABASE_ANON_KEY`（auth 客户端用，非 service-role）。
  - DB：`profiles`（id→auth.users、email、display_name、role check）+ `tickets.requester_user_id`
    （→auth.users，加索引）。RLS 仍开启无 public policy（follow-up 再加 policies）。
  - 客户端分层：`src/lib/supabase/auth-server.ts`（`@supabase/ssr` 的 cookie-aware server client，
    仅管 auth）；`src/lib/supabase/server.ts` service-role 仍管数据。
  - 角色 helper（`src/lib/auth.ts` 重写）：`getCurrentUserProfile` / `requireProfile` /
    `requireRole(...roles)` / `canViewTicket` / `canMutateTicket`。
  - 登录：`login/actions.ts` 改用 `auth.signInWithPassword` / `signOut`；`proxy.ts` 改用 Supabase
    session（`auth.getUser`）判断登录态。删除旧的单账号常量/`session.ts`。
  - 数据/动作：`listTickets` 按角色过滤（employee 只看自己）；详情页 `canViewTicket` 把越权当
     not-found；`createTicketAction` 服务端 stamp `requester_user_id`（任何角色）；
     status/assign/note/reply 限 `it_support`+`admin`；delete 限 `admin`。**UI 最后改**：按角色隐藏控件，
     但**安全靠服务端，不靠 UI 隐藏**（Codex P1）。
  - 种子：`scripts/seed-users.ts`（service-role admin API 建 3 用户 + profiles + 回填旧工单）。
- **替代方案**：自建多账号（不引入 Supabase Auth，自己哈希密码）——更轻但要自管密码、不够"真实"，
  Owner 选了 Supabase Auth。直接上 RLS——更安全但本阶段更重，放 follow-up。
- **运维待办（需 Owner）**：跑 `supabase/migration-2026-06-23-rbac.sql`；本地/Vercel 加
  `SUPABASE_ANON_KEY`；跑 `node --env-file=.env.local scripts/seed-users.ts` 建账号 + 回填。
  Supabase 需启用 Email 登录（默认开）。
- **暂不做**：注册/邀请流、密码重置定制、角色管理 UI、teams/departments、RLS policies（紧随的 follow-up）、
  额外审计日志、support/admin 代他人建单（v1 requester = 当前登录用户）。

### D14 补充（测试反馈修复）
- **登录失败保留 email**：`loginAction` 失败时回传输入的 email，登录框用 `defaultValue` 显示
  （React 19 表单 action 后会重置非受控输入；密码不回传所以清空）。只需重输密码。
- **员工隔离演示**：员工账号从 1 个改为 3 个（tom/jerry/mia）。`scripts/seed-users.ts` 把现有工单
  round-robin 分给三人，并把每条工单的 requester 署名改为对应员工。这样登录 tom 只看到 tom 的工单
  （此前"看到全部"并非权限 bug——过滤逻辑正确，只是种子把所有旧工单都回填给了单一 employee）。

## D15 — 下一阶段改为 AI API v1，随后做 FAQ / Knowledge Base
- **背景**：RBAC Auth v1 完成后，Owner 想先用自己的 API key 测试真实 AI 能力：生成建议回复、
  分类建议和优先级建议。AI API 后的下一阶段，希望给 Admin / IT Support 加 FAQ / 常见 ticket
  问题页面，并保持代码以后容易扩展。
- **决定**：
  - 下一阶段命名为 **AI API v1**。
  - API key 只放 server env（如 `AI_API_KEY` / `AI_API_BASE_URL` / `AI_MODEL`），不进入客户端 bundle。
  - 新增 provider adapter 层（例如 `src/lib/ai/provider.ts`），业务代码只依赖项目内统一接口，
    方便 Owner 先用自己的 API 测试，后续替换供应商。
  - AI 功能只对 `it_support` / `admin` 可用；Employee 仍只查看 ticket 状态和 IT 回复。
  - AI 返回结构化建议：`replyDraft`、`suggestedCategory`、`suggestedPriority`、`confidence`、`reason`。
  - `suggestedCategory` / `suggestedPriority` 必须经过现有 enum 校验；AI 输出永远只是 suggestion，
    v1 不自动修改 ticket。
  - 保留现有 `reply-templates.ts` 本地模板作为 fallback：API 未配置、失败、超时或返回非法结构时仍可用。
- **FAQ / Knowledge Base 方向**：
  - AI API 后再做 Admin / IT Support 可见的 FAQ / 常见 ticket 问题模块。
  - 优先复用或演进 `solutionTemplates` 的数据形状，不把 FAQ 文案硬编码在组件里。
  - v1 可先用 TS data module；后续如需要编辑/搜索/权限管理，再迁移到 Supabase 表。
  - AI prompt 设计要能在未来注入相关 FAQ entry，作为生成回复的上下文。
- **暂不做**：自动发送邮件、自动应用分类/优先级、面向 Employee 的 FAQ 门户、完整 CMS、向量搜索。

## D15 — AI API v1：真实 LLM 生成回复/优先级/分类建议（Owner 开新 scope）
- **背景**：Owner 要接入 API,让系统生成推荐回复 + 优先级 + 分类建议。Codex「RBAC review」要求
  先修详情页 metadata 越权泄露,再做 AI;AI 必须 server-only、单 adapter 可换 provider、staff-only、
  enum-safe、保留本地模板兜底、返回结构化结果。
- **先修的安全项(Codex P2)**：`generateMetadata` 之前在 `canViewTicket` 之前就返回真实标题,员工
  打开他人工单会从浏览器标题泄露。已改为先取 profile + `canViewTicket`,无权时返回通用 "Ticket not
  found" 标题;并把 `getTicketById` 包 React `cache()`,metadata 与页面 body 共用一次查询。
- **Owner 拍板**：① 用 **Anthropic Claude**;② 用 **Vercel AI SDK**(`ai` + `@ai-sdk/anthropic`);
  ③ **生成 + 一键应用**建议的优先级/分类。
- **实现**:
  - 依赖:`ai` + `@ai-sdk/anthropic`(第 3/4 个运行时依赖)。env `ANTHROPIC_API_KEY`(server-only,
    可选;缺失则降级)+ 可选 `AI_MODEL`(默认 `claude-opus-4-8`)。
  - `src/lib/ai/provider.ts`:adapter——`getAiModel()` / `isAiConfigured()`;换 provider 只改这里。
  - `src/lib/ai/suggest.ts`:`generateTicketSuggestion(ticket)` 用 `generateObject` + `jsonSchema`
    (无 zod)产出 `{ replyDraft, suggestedCategory, suggestedPriority, reasoning, confidence, source }`;
    category/priority 用 schema enum 约束 **且** 服务端用 `isTicketCategory/isTicketPriority` 再校验
    (Codex 要求);把相关 `solutionTemplates` 作为 KB 上下文喂给模型(知识库保持灵活)。AI 未配置或
    调用失败 → 回退到本地模板草稿 + 当前 category/priority,`source: "fallback"`。
  - Server Actions(`actions.ts`):`generateSuggestionAction`(staff-only,只读,不落库)+
    `applySuggestionAction`(staff-only,enum 校验后改 priority/category + 记 activity)。
  - `updateTicketFields` 扩展支持 priority/category;`validation.ts` 加 `validatePriority`/`validateCategory`。
  - UI:`ai-suggested-reply.tsx` 改为调真实 action,展示草稿 + 建议优先级/分类(可一键 Apply)+ 理由 +
    信心 + 来源徽标(AI / Local template)。客户端不导入 AI SDK(action 返回类型用 `Awaited<ReturnType>`),
    密钥不进浏览器。
- **替代方案**:Vercel AI Gateway(一 key 多 provider)——Owner 选了直连 Anthropic;OpenAI——同上;
  Anthropic 官方 SDK——Owner 选了 AI SDK(结构化输出更省事、换 provider 容易)。
- **运维待办(需 Owner)**:本地 `.env.local` + Vercel 加 `ANTHROPIC_API_KEY` 才会用真实 AI;不加则
  自动用本地模板兜底(功能不报错)。
- **暂不做**:把 AI 建议写进 create 表单、真实 LLM 分流/缓存、知识库文章页、关键词搜索(扩展点已留)。
