"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { mockTickets } from "@/lib/mock-tickets";
import {
  applyTicketFilters,
  countByStatus,
  sortByUpdatedDesc,
  STATUS_ORDER,
} from "@/lib/ticket-utils";
import type { PriorityFilter, StatusFilter, TicketStatus } from "@/lib/types";
import { StatCard } from "@/components/stat-card";
import { TicketFilters } from "@/components/ticket-filters";
import { TicketList } from "@/components/ticket-list";

export default function DashboardPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [query, setQuery] = useState("");

  // 统计基于全部工单（不随筛选变化），点击卡片再筛选列表。
  const counts = useMemo(() => countByStatus(mockTickets), []);

  const visibleTickets = useMemo(() => {
    const filtered = applyTicketFilters(mockTickets, {
      status,
      priority,
      query,
    });
    return sortByUpdatedDesc(filtered);
  }, [status, priority, query]);

  const hasActiveFilters =
    status !== "all" || priority !== "all" || query.trim() !== "";

  // 点击当前已选中的状态卡片 → 取消该筛选。
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
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-foreground">
            Ticket Assistant
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            轻量 IT 工单管理 · 共 {mockTickets.length} 张工单
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        >
          + 新建工单
        </Link>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-xs text-faint">
            {visibleTickets.length} 条结果
          </span>
        </div>
        <TicketList
          tickets={visibleTickets}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClear}
        />
      </section>
    </main>
  );
}
