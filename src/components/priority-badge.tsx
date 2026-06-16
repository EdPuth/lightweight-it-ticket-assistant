import type { TicketPriority } from "@/lib/types";
import { PRIORITY_DOT_CLASS, PRIORITY_LABELS } from "@/lib/ticket-utils";

// 优先级徽标：与 StatusBadge 同款样式，保持视觉一致。
export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/80">
      <span
        className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT_CLASS[priority]}`}
        aria-hidden="true"
      />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
