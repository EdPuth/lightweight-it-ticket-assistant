import type { TicketStatus } from "@/lib/types";
import { STATUS_DOT_CLASS, STATUS_LABELS } from "@/lib/ticket-utils";

// 状态徽标：中性淡底胶囊 + 彩色圆点 + 文字。颜色仅来自圆点（设计语言见 globals.css）。
export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/80">
      <span
        className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[status]}`}
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
