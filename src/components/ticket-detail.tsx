"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Ticket, TicketActivity, TicketStatus } from "@/lib/types";
import {
  CATEGORY_LABELS,
  formatDateTime,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/lib/ticket-utils";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { ActivityTimeline } from "./activity-timeline";
import { AiSuggestedReply } from "./ai-suggested-reply";

// 工单详情：状态切换与新增备注只更新内存状态（mock，无后端），刷新页面会重置。
export function TicketDetail({ ticket }: { ticket: Ticket }) {
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [activities, setActivities] = useState<TicketActivity[]>(
    ticket.activities,
  );
  const [updatedAt, setUpdatedAt] = useState(ticket.updatedAt);
  const [noteDraft, setNoteDraft] = useState("");

  // 为新增的本地活动生成唯一 id（仅内存使用）。
  const localSeq = useRef(0);
  const nextActivityId = () => `LOCAL-${(localSeq.current += 1)}`;

  const appendActivity = (activity: TicketActivity) => {
    setActivities((prev) => [...prev, activity]);
    setUpdatedAt(activity.createdAt);
  };

  const handleStatusChange = (next: TicketStatus) => {
    if (next === status) return;
    appendActivity({
      id: nextActivityId(),
      type: "status_changed",
      author: "IT Support",
      content: `Status changed from ${STATUS_LABELS[status]} to ${STATUS_LABELS[next]}.`,
      createdAt: new Date().toISOString(),
    });
    setStatus(next);
  };

  const handleAddNote = () => {
    const content = noteDraft.trim();
    if (!content) return;
    appendActivity({
      id: nextActivityId(),
      type: "note",
      author: "IT Support",
      content,
      createdAt: new Date().toISOString(),
    });
    setNoteDraft("");
  };

  // Insert an AI-suggested draft into the timeline as a reply activity.
  const handleInsertReply = (content: string) => {
    appendActivity({
      id: nextActivityId(),
      type: "reply",
      author: "IT Support",
      content,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 rounded"
      >
        <span aria-hidden="true">←</span> Back to tickets
      </Link>

      <header className="mt-6">
        <span className="font-mono text-xs tracking-wide text-faint">
          {ticket.id}
        </span>
        <h1 className="mt-1 font-serif text-3xl leading-tight tracking-tight text-foreground">
          {ticket.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/80">
            {CATEGORY_LABELS[ticket.category]}
          </span>
        </div>
      </header>

      <dl className="mt-6 grid gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:grid-cols-2">
        <DetailField label="Requester" value={ticket.requesterName} />
        <DetailField label="Email" value={ticket.requesterEmail} mono />
        <DetailField label="Assignee" value={ticket.assignedTo ?? "Unassigned"} />
        <DetailField label="Created" value={formatDateTime(ticket.createdAt)} />
        <DetailField label="Last updated" value={formatDateTime(updatedAt)} />
      </dl>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted">Description</h2>
        <div className="rounded-xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-foreground/90 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {ticket.description}
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <label
          htmlFor="status-select"
          className="text-sm font-medium text-foreground"
        >
          Change status
        </label>
        <select
          id="status-select"
          value={status}
          onChange={(event) =>
            handleStatusChange(event.target.value as TicketStatus)
          }
          className="rounded-xl border border-border bg-surface py-2 pl-3 pr-8 text-sm text-foreground focus:border-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
        >
          {STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </section>

      <AiSuggestedReply ticket={ticket} onInsert={handleInsertReply} />

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-medium text-muted">Activity</h2>
        <ActivityTimeline activities={activities} />

        <div className="mt-5">
          <label htmlFor="note-input" className="sr-only">
            Add an internal note
          </label>
          <textarea
            id="note-input"
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            rows={3}
            placeholder="Add an internal note… (in-memory only, resets on refresh)"
            className="w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-faint shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus:border-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleAddNote}
              disabled={!noteDraft.trim()}
              className="ticket-card rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              Add note
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-faint">{label}</dt>
      <dd
        className={`mt-0.5 text-foreground ${mono ? "font-mono text-[13px]" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
