# 数据库接入与部署指南（Supabase + Vercel）

本项目用 **Supabase（托管 PostgreSQL）** 存储工单。下面每一步都要你本人操作（要登录你的账号），
代码、SQL、env 模板我都已经准备好。

---

## 一、创建 Supabase 项目（约 5 分钟）

1. 打开 https://supabase.com → 点 **Start your project** → 用 GitHub 登录。
2. 点 **New project**：
   - Organization 选默认即可。
   - Name：`lightweight-it-ticket-assistant`（随意）。
   - Database Password：设一个并**自己记好**（建库时偶尔会用到）。
   - Region：选离你最近的（如 Singapore / Tokyo）。
   - 点 **Create new project**，等 1~2 分钟初始化完成。

## 二、拿到连接密钥（填进本地 .env.local）

1. 进项目 → 左下 **Project Settings**（齿轮）→ **API**。
2. 复制这两个值发给我（或自己填进 `.env.local`）：
   - **Project URL** → `SUPABASE_URL`
   - **Project API keys** 里的 **`service_role`**（点 Reveal）→ `SUPABASE_SERVICE_ROLE_KEY`
     - ⚠️ 一定是 **service_role**（secret），不是 anon/public。
3. 在项目根目录把 `.env.example` 复制成 `.env.local`，填入上面两个值：
   ```bash
   cp .env.example .env.local
   ```
   `.env.local` 已被 git 忽略，不会上传。**service_role 是密钥，别发到公开场合。**

## 三、建表 + 灌入种子数据

1. Supabase 项目 → 左侧 **SQL Editor** → **New query**。
2. 打开本仓库的 [`supabase/schema.sql`](../supabase/schema.sql)，全选复制 → 粘贴 → 点 **Run**（建表）。
3. 再 New query → 复制 [`supabase/seed.sql`](../supabase/seed.sql) → 粘贴 → **Run**
   （灌入 13 条种子工单 + 31 条活动记录）。
4. 可在左侧 **Table Editor** 看到 `tickets` / `activities` 两张表有数据了。

> 种子数据由 `src/lib/mock-tickets.ts` 生成。以后想重新生成：
> `node scripts/gen-seed.ts > supabase/seed.sql`

## 四、本地跑通

1. 确认 `.env.local` 填好。
2. `npm run dev` → 打开 http://localhost:3000 → 列表应来自数据库。
3. 新建一张工单 → 刷新后**它还在**（这就是和之前 mock 的关键区别）。

---

## 五、部署到 Vercel（约 5 分钟）

1. 打开 https://vercel.com → 用 GitHub 登录 → **Add New… → Project**。
2. 选 **Import** 仓库 `EdPuth/lightweight-it-ticket-assistant`。
3. 在 **Environment Variables** 里加两条（和 `.env.local` 同值）：
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ 两个都**不要**加 `NEXT_PUBLIC_` 前缀（service_role 是服务端密钥）。
4. 点 **Deploy**，等构建完成 → 得到线上 URL。
5. 之后每次 `git push` 到 `main`，Vercel 会自动重新部署。

> 线上和本地连的是**同一个 Supabase 库**，所以数据一致。

---

## 安全说明（practice 级）

- 现阶段**没有登录**：任何能打开页面的人都能读写工单——适合练习/演示，不适合放真实数据。
- `service_role` 密钥能绕过数据库权限（RLS），**只在服务端使用**（Server Components / Server Actions），
  绝不会进入浏览器。
- 真实生产应改用 **Supabase Auth + Row Level Security + anon key**，按用户身份限制访问——列为后续方向。
