import type { TicketActivity, TicketActivityType } from "@/lib/types";
import { ACTIVITY_TYPE_LABELS, formatDateTime } from "@/lib/ticket-utils";

// 不同活动类型的圆点颜色，呼应整体单色 + 彩色圆点的设计语言。
const ACTIVITY_DOT_CLASS: Record<TicketActivityType, string> = {
  created: "bg-gray-400",
  status_changed: "bg-blue-500",
  note: "bg-amber-500",
  reply: "bg-emerald-500",
};

// 活动时间线：左侧发丝竖线 + 圆点，按时间顺序由上到下。
export function ActivityTimeline({
  activities,
}: {
  activities: TicketActivity[];
}) {
  return (
    <ol className="relative ml-1.5 border-l border-border">
      {activities.map((activity) => (
        <li key={activity.id} className="relative pb-6 pl-6 last:pb-0">
          <span
            className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background ${ACTIVITY_DOT_CLASS[activity.type]}`}
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="font-medium text-foreground/80">
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
            <span aria-hidden="true" className="text-faint">·</span>
            <span>{activity.author}</span>
            <span aria-hidden="true" className="text-faint">·</span>
            <span>{formatDateTime(activity.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
            {activity.content}
          </p>
        </li>
      ))}
    </ol>
  );
}
