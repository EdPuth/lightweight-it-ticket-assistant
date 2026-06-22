"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ACTIVE_STATUSES,
  applyTicketFilters,
  countByStatus,
  sortByUpdatedDesc,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/lib/ticket-utils";
import type { PriorityFilter, StatusFilter, Ticket, TicketStatus } from "@/lib/types";
import { StatCard } from "@/components/stat-card";
import { TicketFilters } from "@/components/ticket-filters";
import { TicketList } from "@/components/ticket-list";
import { LogoutButton } from "@/components/logout-button";

// Client dashboard: filtering/search/sort over the tickets fetched on the
// server and passed in as a prop. No data fetching here.
export function DashboardClient({ tickets }: { tickets: Ticket[] }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => countByStatus(tickets), [tickets]);

  // Default view shows active tickets only. Resolved/closed are reachable by
  // clicking their status card (which sets an explicit status filter).
  const visibleTickets = useMemo(() => {
    const byStatus =
      status === "all"
        ? tickets.filter((t) => ACTIVE_STATUSES.includes(t.status))
        : tickets.filter((t) => t.status === status);
    const filtered = applyTicketFilters(byStatus, { priority, query });
    return sortByUpdatedDesc(filtered);
  }, [tickets, status, priority, query]);

  // How many tickets are hidden by the active-only default (so we can say so).
  const hiddenCount = counts.resolved + counts.closed;

  const hasActiveFilters =
    status !== "all" || priority !== "all" || query.trim() !== "";

  const handleSelectStatus = (next: TicketStatus) => {
    setStatus((current) => (current === next ? "all" : next));
  };

  const handleClear = () => {
    setStatus("all");
    setPriority("all");
    setQuery("");
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:py-16">
      <div className="mb-6 flex items-center justify-between text-xs text-faint">
        <span>
          Signed in as{" "}
          <span className="font-mono text-muted">itsupport@outlook.com</span>
        </span>
        <LogoutButton />
      </div>

      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-foreground">
            Ticket Assistant
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Lightweight IT support · {tickets.length} tickets total
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        >
          + New ticket
        </Link>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATUS_ORDER.map((value, index) => (
          <div
            key={value}
            className="rise"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <StatCard
              status={value}
              count={counts[value]}
              active={status === value}
              onSelect={handleSelectStatus}
            />
          </div>
        ))}
      </section>

      <section className="mt-8">
        <TicketFilters
          query={query}
          priority={priority}
          hasActiveFilters={hasActiveFilters}
          onQueryChange={setQuery}
          onPriorityChange={setPriority}
          onClear={handleClear}
        />
      </section>

      <section className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1">
          <span className="text-xs text-faint">
            {visibleTickets.length}{" "}
            {visibleTickets.length === 1 ? "result" : "results"}
            {status === "all"
              ? " · active tickets"
              : ` · ${STATUS_LABELS[status]}`}
          </span>
          {status === "all" && hiddenCount > 0 ? (
            <span className="text-xs text-faint">
              {hiddenCount} resolved/closed hidden — open a status card to view
            </span>
          ) : null}
        </div>
        <TicketList tickets={visibleTickets} hasActiveFilters={hasActiveFilters} />
      </section>
    </main>
  );
}
