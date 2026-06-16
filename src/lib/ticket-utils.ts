import type {
  PriorityFilter,
  StatusFilter,
  Ticket,
  TicketActivityType,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from './types';

// ---------------------------------------------------------------------------
// 展示用映射：label（中文）与 badge 颜色（Tailwind 类）集中放在这里，
// 组件只引用，不各自硬编码颜色。颜色约定见 docs/frontend-spec.md。
// ---------------------------------------------------------------------------

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  email: 'Email',
  network: 'Network',
  hardware: 'Hardware',
  software: 'Software',
  access: 'Access',
  other: 'Other',
};

export const ACTIVITY_TYPE_LABELS: Record<TicketActivityType, string> = {
  created: '创建',
  status_changed: '状态变更',
  note: '内部备注',
  reply: '回复',
};

// 状态 / 优先级的圆点颜色（Tailwind 实心色）。
// 设计上整体近乎单色，颜色只体现在这个小圆点上，由 Badge 组件统一渲染。
export const STATUS_DOT_CLASS: Record<TicketStatus, string> = {
  open: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  waiting: 'bg-gray-400',
  resolved: 'bg-emerald-500',
};

export const PRIORITY_DOT_CLASS: Record<TicketPriority, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

// 稳定的展示 / 筛选顺序（供 Phase 2 的筛选下拉与统计卡片复用）。
export const STATUS_ORDER: TicketStatus[] = [
  'open',
  'in_progress',
  'waiting',
  'resolved',
];

export const PRIORITY_ORDER: TicketPriority[] = [
  'urgent',
  'high',
  'medium',
  'low',
];

export const CATEGORY_ORDER: TicketCategory[] = [
  'email',
  'network',
  'hardware',
  'software',
  'access',
  'other',
];

// ---------------------------------------------------------------------------
// 纯查询 / 筛选函数：不修改入参，始终返回新数组。
// ---------------------------------------------------------------------------

/** 按 id 查找单个工单，找不到返回 undefined。 */
export function getTicketById(
  tickets: Ticket[],
  id: string,
): Ticket | undefined {
  return tickets.find((ticket) => ticket.id === id);
}

/** 按关键字搜索：匹配 id、标题、请求人姓名或邮箱（不区分大小写）。空关键字返回全部。 */
export function searchTickets(tickets: Ticket[], query: string): Ticket[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...tickets];

  return tickets.filter((ticket) => {
    return (
      ticket.id.toLowerCase().includes(q) ||
      ticket.title.toLowerCase().includes(q) ||
      ticket.requesterName.toLowerCase().includes(q) ||
      ticket.requesterEmail.toLowerCase().includes(q)
    );
  });
}

/** 按状态 / 优先级筛选；传 'all' 表示不限制该维度。 */
export function filterTickets(
  tickets: Ticket[],
  filters: { status?: StatusFilter; priority?: PriorityFilter },
): Ticket[] {
  const { status = 'all', priority = 'all' } = filters;

  return tickets.filter((ticket) => {
    const statusOk = status === 'all' || ticket.status === status;
    const priorityOk = priority === 'all' || ticket.priority === priority;
    return statusOk && priorityOk;
  });
}

/** 组合：先按状态/优先级筛选，再按关键字搜索。供 Dashboard 一次性调用。 */
export function applyTicketFilters(
  tickets: Ticket[],
  options: {
    status?: StatusFilter;
    priority?: PriorityFilter;
    query?: string;
  },
): Ticket[] {
  const filtered = filterTickets(tickets, {
    status: options.status,
    priority: options.priority,
  });
  return searchTickets(filtered, options.query ?? '');
}

/** 统计每种状态的工单数量，返回包含全部状态键的 Record。 */
export function countByStatus(tickets: Ticket[]): Record<TicketStatus, number> {
  const counts: Record<TicketStatus, number> = {
    open: 0,
    in_progress: 0,
    waiting: 0,
    resolved: 0,
  };

  for (const ticket of tickets) {
    counts[ticket.status] += 1;
  }

  return counts;
}

/** 按 updatedAt 降序排序（最近更新在前），返回新数组。 */
export function sortByUpdatedDesc(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

// ---------------------------------------------------------------------------
// 日期格式化：基于 ISO 字符串做确定性输出，避免 SSR/CSR 因时区不同产生
// hydration 不一致。统一展示为 UTC。
// ---------------------------------------------------------------------------

/** 把 ISO 字符串格式化为 "YYYY-MM-DD HH:mm UTC"。无效输入原样返回。 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
}

/**
 * 相对时间，如 "3 小时前"。now 可注入以保持纯函数 / 可测试，
 * 默认取 Date.now()（仅建议在客户端组件中使用，避免 hydration 警告）。
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return iso;

  const diffMs = now - time;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} 天前`;

  return formatDateTime(iso);
}
