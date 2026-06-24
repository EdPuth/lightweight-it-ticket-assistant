# Project Brief — Lightweight IT Support Ticket Assistant

## 一句话定位
一个适合新手练习 agent 开发的轻量 IT 工单管理 Web App，模拟小型公司内部 IT Support 团队
处理员工请求的流程。

## 目标用户
- IT Support / Helpdesk 人员
- 小型公司内部员工

## 核心问题
员工的 IT 请求分散在邮件、聊天和口头沟通中，难以追踪状态、优先级和处理记录。

## MVP 目标
能创建工单、查看列表、筛选状态/优先级、查看详情、添加回复/处理记录，并生成一个
AI suggested reply 的草稿（mock）。

## MVP 范围

| 模块 | 必须实现 | 暂不实现 / 后续扩展 |
|---|---|---|
| Ticket Dashboard | 统计卡片；按状态/优先级筛选；搜索标题/请求人；最近工单列表 | 复杂 BI 图表、多团队权限 |
| Ticket List | ID、标题、请求人、分类、优先级、状态、更新时间 | 服务器端分页、高级查询语法 |
| Ticket Detail | 详情、处理记录、内部备注、状态切换 | 真实邮件同步、附件上传 |
| Create Ticket | 姓名、邮箱、标题、描述、分类、优先级 | 完整登录系统、审批流 |
| AI Suggested Reply | 根据描述生成 mock 回复草稿，可复制/插入 | 真实 LLM API、自动发送邮件 |
| Project Docs | README、CLAUDE.md、AGENTS.md、docs/* | 复杂架构文档平台 |

## 当前 Post-MVP 扩展目标

已从单账号登录升级为 **RBAC Auth v1**：多个账号登录，并按角色限制数据可见性与操作权限。
角色固定为 Employee、IT Support、Admin：
- Employee 只能创建并查看自己的 ticket、处理状态和 IT 回复。
- IT Support 可以查看和处理全部 ticket，但不能删除。
- Admin 拥有全部权限，包括删除。

下一阶段目标是 **AI API v1**：用 server-only API key 生成建议回复、分类建议和优先级建议。
AI 建议只给 IT Support / Admin 使用，并且只作为 suggestion，不自动修改 ticket。

AI API 后的目标是 Admin / IT Support 可见的 FAQ / Knowledge Base，用于沉淀常见 ticket 问题和
解决步骤，并保持数据结构灵活，方便未来被搜索或作为 AI 上下文。

## 数据模型（来自文档 §5）

```ts
type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketCategory = 'email' | 'network' | 'hardware' | 'software' | 'access' | 'other';

type Ticket = {
  id: string;
  title: string;
  requesterName: string;
  requesterEmail: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  createdAt: string;   // ISO 字符串
  updatedAt: string;   // ISO 字符串
  assignedTo?: string;
  activities: TicketActivity[];
};

type TicketActivity = {
  id: string;
  type: 'created' | 'status_changed' | 'note' | 'reply';
  author: string;
  content: string;
  createdAt: string;   // ISO 字符串
};
```

## 技术栈
Next.js 16（App Router）+ TypeScript + Tailwind v4 + 自定义组件 + mock data + React 状态。

## Definition of Done
- App 能在本地运行，无明显报错。
- Dashboard、列表、详情、创建、mock AI 回复都可用。
- 全程 TypeScript；组件结构可理解。
- README 说明安装、功能、限制。
- `docs/tasks.md` 显示 completed / next / risks。
- `docs/codex-review.md` 存在，高优先级问题已修复或记录。
- MVP 没有扩张成复杂的企业级 helpdesk。
