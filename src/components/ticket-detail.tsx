"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import type { Ticket, TicketStatus } from "@/lib/types";
import {
  CATEGORY_LABELS,
  formatDateTime,
  STATUS_LABELS,
  STATUS_ORDER,
  TECHNICIANS,
} from "@/lib/ticket-utils";
import {
  addNoteAction,
  assignAction,
  changeStatusAction,
  insertReplyAction,
} from "@/app/actions";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { ActivityTimeline } from "./activity-timeline";
import { AiSuggestedReply } from "./ai-suggested-reply";
import { DeleteTicket } from "./delete-ticket";

// 工单详情：状态切换 / 指派 / 备注 / 插入回复都通过 Server Actions 落库（持久化）。
// DB 为唯一真相：操作后 revalidatePath 用最新数据重渲染本组件（props 更新）。
// 状态/指派的 select 用 useOptimistic 即时反映选择，事务完成后自动对齐回 DB 真值。
export function TicketDetail({
  ticket,
  canProcess,
  canDelete,
  relatedGuidelines = [],
}: {
  ticket: Ticket;
  canProcess: boolean;
  canDelete: boolean;
  relatedGuidelines?: { id: string; title: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [noteDraft, setNoteDraft] = useState("");

  // Optimistic values reflect the user's choice immediately and automatically
  // reconcile back to the authoritative database value once the action's
  // revalidation delivers fresh props.
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(ticket.status);
  const [optimisticAssignee, setOptimisticAssignee] = useOptimistic(
    ticket.assignedTo ?? "",
  );

  // Build the assignee options: Unassigned + known technicians, plus the
  // ticket's current assignee if it isn't already in the list (e.g. seeded
  // data like "IT - Daniel"), so the select always reflects reality.
  const assigneeOptions = [
    ...TECHNICIANS,
    ...(optimisticAssignee && !TECHNICIANS.includes(optimisticAssignee)
      ? [optimisticAssignee]
      : []),
  ];

  const handleStatusChange = (next: TicketStatus) => {
    if (next === optimisticStatus) return;
    startTransition(() => {
      setOptimisticStatus(next);
      return changeStatusAction(ticket.id, next);
    });
  };

  const handleAddNote = () => {
    const content = noteDraft.trim();
    if (!content) return;
    setNoteDraft("");
    startTransition(() => addNoteAction(ticket.id, content));
  };

  const handleAssigneeChange = (next: string) => {
    if (next === optimisticAssignee) return;
    startTransition(() => {
      setOptimisticAssignee(next);
      return assignAction(ticket.id, next);
    });
  };

  // Insert an AI-suggested draft into the timeline as a reply activity.
  const handleInsertReply = (content: string) => {
    startTransition(() => insertReplyAction(ticket.id, content));
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
          <StatusBadge status={optimisticStatus} />
          <PriorityBadge priority={ticket.priority} />
          <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/80">
            {CATEGORY_LABELS[ticket.category]}
          </span>
        </div>
      </header>

      <dl className="mt-6 grid gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:grid-cols-2">
        <DetailField label="Requester" value={ticket.requesterName} />
        <DetailField label="Email" value={ticket.requesterEmail} mono />
        <DetailField label="Assignee" value={optimisticAssignee || "Unassigned"} />
        <DetailField label="Created" value={formatDateTime(ticket.createdAt)} />
        <DetailField
          label="Last updated"
          value={formatDateTime(ticket.updatedAt)}
        />
      </dl>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted">Description</h2>
        <div className="rounded-xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-foreground/90 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {ticket.description}
        </div>
      </section>

      {canProcess && relatedGuidelines.length > 0 ? (
        <aside className="mt-6 rounded-xl border border-blue-200 bg-blue-50/40 px-5 py-3">
          <p className="text-xs text-muted">
            Related guideline{relatedGuidelines.length > 1 ? "s" : ""} — this
            ticket looks related to:
          </p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {relatedGuidelines.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/faq/${g.id}?from=/tickets/${ticket.id}`}
                  className="text-sm font-medium text-blue-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
                >
                  {g.title} →
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      {canProcess ? (
      <section className="mt-6 grid gap-4 rounded-xl border border-border bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="status-select"
            className="text-sm font-medium text-foreground"
          >
            Change status
          </label>
          <select
            id="status-select"
            value={optimisticStatus}
            disabled={isPending}
            onChange={(event) =>
              handleStatusChange(event.target.value as TicketStatus)
            }
            className="rounded-xl border border-border bg-surface py-2 pl-3 pr-8 text-sm text-foreground focus:border-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 disabled:opacity-50"
          >
            {STATUS_ORDER.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="assignee-select"
            className="text-sm font-medium text-foreground"
          >
            Assignee
          </label>
          <select
            id="assignee-select"
            value={optimisticAssignee}
            disabled={isPending}
            onChange={(event) => handleAssigneeChange(event.target.value)}
            className="rounded-xl border border-border bg-surface py-2 pl-3 pr-8 text-sm text-foreground focus:border-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 disabled:opacity-50"
          >
            <option value="">Unassigned</option>
            {assigneeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </section>
      ) : null}

      {canProcess ? (
        <AiSuggestedReply ticket={ticket} onInsert={handleInsertReply} />
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">Activity</h2>
          {isPending ? (
            <span className="text-xs text-faint" aria-live="polite">
              Saving…
            </span>
          ) : null}
        </div>
        <ActivityTimeline activities={ticket.activities} />

        {canProcess ? (
          <div className="mt-5">
            <label htmlFor="note-input" className="sr-only">
              Add an internal note
            </label>
            <textarea
              id="note-input"
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              rows={3}
              placeholder="Add an internal note…"
              className="w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-faint shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus:border-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!noteDraft.trim() || isPending}
                className="ticket-card rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                Add note
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {canDelete ? <DeleteTicket ticketId={ticket.id} /> : null}
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
