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
