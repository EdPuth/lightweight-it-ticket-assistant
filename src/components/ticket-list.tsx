import type { Ticket } from "@/lib/types";
import { TicketCard } from "./ticket-card";

// 工单列表：有结果时渲染卡片堆叠；无结果时显示友好空状态。
// 区分两种空：完全没有工单 vs 筛选/搜索后无匹配（后者提供"清除筛选"）。
export function TicketList({
  tickets,
  hasActiveFilters,
}: {
  tickets: Ticket[];
  hasActiveFilters: boolean;
}) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
        <p className="font-serif text-lg text-foreground">
          {hasActiveFilters ? "No matching tickets" : "No tickets yet"}
        </p>
        <p className="mt-1.5 text-sm text-muted">
          {hasActiveFilters
            ? "Try adjusting your search, or use Clear filters above."
            : "New tickets will show up here."}
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {tickets.map((ticket, index) => (
        <li
          key={ticket.id}
          className="rise"
          // 逐个浮现：按顺序错开入场，最多累计到第 12 个，避免长列表等待过久。
          style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
        >
          <TicketCard ticket={ticket} />
        </li>
      ))}
    </ul>
  );
}
