import type { PriorityFilter } from "@/lib/types";
import { PRIORITY_LABELS, PRIORITY_ORDER } from "@/lib/ticket-utils";

// 搜索 + 优先级筛选 + 清除。状态筛选由顶部统计卡片负责（单一数据源）。
export function TicketFilters({
  query,
  priority,
  hasActiveFilters,
  onQueryChange,
  onPriorityChange,
  onClear,
}: {
  query: string;
  priority: PriorityFilter;
  hasActiveFilters: boolean;
  onQueryChange: (value: string) => void;
  onPriorityChange: (value: PriorityFilter) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="m14 14 3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by title, requester, email, or ticket ID…"
          aria-label="Search tickets"
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-faint shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus:border-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
        />
      </div>

      <label className="sr-only" htmlFor="priority-filter">
        Filter by priority
      </label>
      <select
        id="priority-filter"
        value={priority}
        onChange={(event) =>
          onPriorityChange(event.target.value as PriorityFilter)
        }
        className="rounded-xl border border-border bg-surface py-2.5 pl-3 pr-8 text-sm text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus:border-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
      >
        <option value="all">All priorities</option>
        {PRIORITY_ORDER.map((value) => (
          <option key={value} value={value}>
            {PRIORITY_LABELS[value]}
          </option>
        ))}
      </select>

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
