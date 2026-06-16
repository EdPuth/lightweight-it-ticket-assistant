// 工单领域的核心类型定义。
// 全部使用字面量联合类型（来自 docs/project-brief.md §数据模型），不使用 any。

export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketCategory =
  | 'email'
  | 'network'
  | 'hardware'
  | 'software'
  | 'access'
  | 'other';

export type TicketActivityType = 'created' | 'status_changed' | 'note' | 'reply';

export type TicketActivity = {
  id: string;
  type: TicketActivityType;
  author: string;
  content: string;
  createdAt: string; // ISO 8601 字符串
};

export type Ticket = {
  id: string;
  title: string;
  requesterName: string;
  requesterEmail: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  createdAt: string; // ISO 8601 字符串
  updatedAt: string; // ISO 8601 字符串
  assignedTo?: string;
  activities: TicketActivity[];
};

// 列表筛选用：'all' 表示不限制该维度。供 Phase 2 的筛选组件复用。
export type StatusFilter = TicketStatus | 'all';
export type PriorityFilter = TicketPriority | 'all';
