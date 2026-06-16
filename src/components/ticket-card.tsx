import Link from "next/link";
import type { Ticket } from "@/lib/types";
import { CATEGORY_LABELS, formatDateTime } from "@/lib/ticket-utils";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";

// 单条工单卡片：纯白卡 + 发丝边 + 极轻阴影，hover 时微微上浮。整卡可点击进入详情。
export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="ticket-card group block rounded-xl border border-border bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-ink/15 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/25"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="font-mono text-[11px] tracking-wide text-faint">
            {ticket.id}
          </span>
          <h3 className="mt-0.5 truncate text-[15px] font-medium text-foreground group-hover:text-ink">
            {ticket.title}
          </h3>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
        <span className="truncate">
          {ticket.requesterName}
        </span>
        <span aria-hidden="true" className="text-faint">·</span>
        <span>{CATEGORY_LABELS[ticket.category]}</span>
        <span aria-hidden="true" className="text-faint">·</span>
        <span>更新于 {formatDateTime(ticket.updatedAt)}</span>
        <span className="ml-auto">
          <PriorityBadge priority={ticket.priority} />
        </span>
      </div>
    </Link>
  );
}
