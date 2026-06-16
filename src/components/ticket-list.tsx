import type { Ticket } from "@/lib/types";
import { TicketCard } from "./ticket-card";

// 工单列表：有结果时渲染卡片堆叠；无结果时显示友好空状态。
// 区分两种空：完全没有工单 vs 筛选/搜索后无匹配（后者提供"清除筛选"）。
export function TicketList({
  tickets,
  hasActiveFilters,
  onClearFilters,
}: {
  tickets: Ticket[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
        <p className="font-serif text-lg text-foreground">
          {hasActiveFilters ? "没有匹配的工单" : "还没有任何工单"}
        </p>
        <p className="mt-1.5 text-sm text-muted">
          {hasActiveFilters
            ? "试着调整搜索词或筛选条件。"
            : "新建工单后会出现在这里。"}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
          >
            清除筛选
          </button>
        ) : null}
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
