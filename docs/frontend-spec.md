# Frontend Spec — 页面与功能设计（来自文档 §4）

## 1. Dashboard 页面（`/`）
- **顶部统计**：Open、In Progress、Waiting、Resolved 数量。
- **中间区域**：搜索框（标题 / 请求人）、状态筛选、优先级筛选。
- **主区域**：ticket 列表（card 或 table）。每项可点击进入详情。
- **辅助区**：最近更新 / 常见分类提示（可选，保持简单）。

## 2. Ticket Detail 页面（`/tickets/[id]`）
- 标题、状态、优先级、分类、请求人信息。
- 问题描述。
- **Activity timeline**：created / status_changed / note / reply。
- **AI Suggested Reply 区块**：根据 ticket 内容生成模板回复（mock）。
- 操作按钮：Change status、Add internal note、Copy AI reply。

## 3. Create Ticket 页面（`/tickets/new`）
- Requester name / email。
- Issue title。
- Category：Email、Network、Hardware、Software、Access、Other。
- Priority：Low、Medium、High、Urgent。
- Description。
- Submit 后跳转到 ticket list 或 ticket detail。

## 4. Empty / Loading / Error 状态
- 没有工单时显示 friendly empty state。
- 筛选无结果时显示 "Clear filters" 按钮。
- AI reply loading 用 skeleton 或简单 loading 文字。
- 错误状态用可读提示，不直接显示技术报错（例如无效 ticket id）。

## 颜色 / Badge 约定（建议）
| 维度 | 值 | 视觉 |
|---|---|---|
| status | open | 蓝 |
| status | in_progress | 黄/琥珀 |
| status | waiting | 灰 |
| status | resolved | 绿 |
| priority | low | 灰 |
| priority | medium | 蓝 |
| priority | high | 橙 |
| priority | urgent | 红 |

> 颜色映射集中放在 `src/lib/ticket-utils.ts`，组件只引用，不各自硬编码。

## 组件清单（计划）
- `ticket-card.tsx` — 列表中的单条工单卡片
- `ticket-list.tsx` — 工单列表容器
- `ticket-filters.tsx` — 搜索 + 状态 + 优先级筛选
- `ticket-detail.tsx` — 详情主体
- `ai-suggested-reply.tsx` — AI 建议回复区块
- 小组件：StatusBadge / PriorityBadge / StatCard（可放在 components 内）
