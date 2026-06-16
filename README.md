# Lightweight IT Support Ticket Assistant

一个轻量的、面向新手练习的 **IT 支持工单管理 Web App**。模拟小型公司内部 IT Support 团队
处理员工请求的流程，重点练习前端页面、数据建模、状态管理、AI 辅助回复（mock）和多 Agent
协作开发流程。

> 这是一个练习项目。**没有后端、没有数据库、没有真实 AI API** —— 所有数据都是 mock data。

## 功能（MVP）

- **Dashboard**：工单统计卡片（Open / In Progress / Waiting / Resolved）、搜索、状态/优先级筛选。
- **Ticket List**：显示 ID、标题、请求人、分类、优先级、状态、更新时间。
- **Ticket Detail**：工单详情、活动时间线、内部备注、状态切换。
- **Create Ticket**：创建工单表单（姓名、邮箱、标题、描述、分类、优先级）+ 基本校验。
- **AI Suggested Reply**：根据工单内容生成一段 *mock* 回复草稿，可复制/插入（明确标注是建议草稿）。

## 技术栈

- Next.js 16（App Router）+ TypeScript
- React 19
- Tailwind CSS v4 + 自定义组件（不用 UI 库）
- React `useState` / `useMemo` 管理状态
- Mock data：`src/lib/mock-tickets.ts`

## 本地运行

```bash
npm install      # 首次需要（脚手架已装好）
npm run dev      # http://localhost:3000
npm run lint     # 代码检查
npm run build    # 生产构建（提交前的门槛）
```

## 项目结构

```
├─ CLAUDE.md            # Claude Code（前端实现 Agent）的角色与规则
├─ AGENTS.md            # Codex（review / 项目管理 Agent）的角色与清单
├─ docs/
│  ├─ project-brief.md  # MVP 范围 + 数据模型
│  ├─ frontend-spec.md  # 页面与功能规格
│  ├─ tasks.md          # 阶段清单：Completed / Next / Risks
│  ├─ decisions.md      # 决策记录
│  ├─ codex-review.md   # Codex 的 review 输出（由 Codex 维护）
│  └─ prompts/          # 给两个 Agent 复用的 prompt
└─ src/
   ├─ app/              # 页面（/, /tickets/[id], /tickets/new）
   ├─ components/       # UI 组件
   └─ lib/              # 类型、mock data、工具函数
```

## 多 Agent 协作

- **Claude Code** 负责前端设计与实现。
- **Codex** 负责 code review 与项目管理。
- 两个 Agent 不互相调用，通过 Git + `docs/` 文件交接。详见 `AGENTS.md` 与 `docs/tasks.md`。

## 限制（Out of Scope）

真实邮件同步、附件上传、用户登录/权限、审批流、真实 LLM API、服务器端分页、复杂 BI 图表
——这些都**不在 MVP 范围内**。后续扩展方向见 `docs/tasks.md`。
