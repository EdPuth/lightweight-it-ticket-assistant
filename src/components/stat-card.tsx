import type { TicketStatus } from "@/lib/types";
import { STATUS_DOT_CLASS, STATUS_LABELS } from "@/lib/ticket-utils";

// 顶部统计卡片，同时充当状态筛选器：点击切换该状态的筛选，再次点击取消。
// active 时显示墨色描边。设计上数字用衬线字体，凸显编辑器式的精致感。
export function StatCard({
  status,
  count,
  active,
  onSelect,
}: {
  status: TicketStatus;
  count: number;
  active: boolean;
  onSelect: (status: TicketStatus) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(status)}
      aria-pressed={active}
      className={`ticket-card flex flex-col items-start gap-1 rounded-xl border bg-surface px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
        active
          ? "border-ink/70 ring-1 ring-ink/15"
          : "border-border hover:border-border"
      }`}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-muted">
        <span
          className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS[status]}`}
          aria-hidden="true"
        />
        {STATUS_LABELS[status]}
      </span>
      <span className="font-serif text-3xl leading-none tracking-tight text-foreground">
        {count}
      </span>
    </button>
  );
}
