"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Ticket } from "@/lib/types";
import {
  CATEGORY_LABELS,
  PRIORITY_DOT_CLASS,
  PRIORITY_LABELS,
} from "@/lib/ticket-utils";
import {
  applySuggestionAction,
  generateSuggestionAction,
} from "@/app/actions";

type ReplyState = "idle" | "loading" | "generated" | "error";
type Suggestion = Awaited<ReturnType<typeof generateSuggestionAction>>;

// AI suggested reply + triage. Calls a staff-only Server Action that uses a real
// model (Claude via the AI SDK), with a local-template fallback when AI is off.
// The technician reviews the draft and can apply the suggested priority/category.
export function AiSuggestedReply({
  ticket,
  onInsert,
}: {
  ticket: Ticket;
  onInsert: (content: string) => void;
}) {
  const [state, setState] = useState<ReplyState>("idle");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [draft, setDraft] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [inserted, setInserted] = useState(false);
  const [isApplying, startApply] = useTransition();
  const [applyError, setApplyError] = useState<string | null>(null);

  const apply = (fields: { priority?: string; category?: string }) => {
    setApplyError(null);
    startApply(async () => {
      try {
        await applySuggestionAction(ticket.id, fields);
      } catch {
        setApplyError("Couldn't apply the suggestion. Please try again.");
      }
    });
  };

  const generate = async () => {
    setState("loading");
    setCopyState("idle");
    setInserted(false);
    try {
      const result = await generateSuggestionAction(ticket.id);
      setSuggestion(result);
      setDraft(result.replyDraft);
      setState("generated");
    } catch {
      setState("error");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 2500);
    }
  };

  const insert = () => {
    onInsert(draft);
    setInserted(true);
  };

  const priorityMatches = suggestion?.suggestedPriority === ticket.priority;
  const categoryMatches = suggestion?.suggestedCategory === ticket.category;

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-foreground">
          AI suggested reply
        </h2>
        <div className="flex items-center gap-2">
          {suggestion ? (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                suggestion.source === "ai"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-black/[0.05] text-muted"
              }`}
            >
              {suggestion.source === "ai" ? "AI" : "Local template"}
            </span>
          ) : null}
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
            Suggested draft — review before sending
          </span>
        </div>
      </div>

      {state === "idle" ? (
        <div className="mt-3">
          <p className="text-sm text-muted">
            Generate a reply draft and triage suggestions (priority &amp;
            category) based on this ticket. You can edit, copy, insert, or apply.
          </p>
          <button
            type="button"
            onClick={generate}
            className="ticket-card mt-3 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            Generate AI suggestion
          </button>
        </div>
      ) : null}

      {state === "loading" ? (
        <div className="mt-4 animate-pulse space-y-2" aria-live="polite">
          <div className="h-3 w-1/3 rounded bg-black/[0.06]" />
          <div className="h-3 w-full rounded bg-black/[0.06]" />
          <div className="h-3 w-5/6 rounded bg-black/[0.06]" />
          <div className="h-3 w-2/3 rounded bg-black/[0.06]" />
        </div>
      ) : null}

      {state === "error" ? (
        <div className="mt-3">
          <p className="text-sm text-red-600">
            Couldn&apos;t generate a suggestion. Please try again.
          </p>
          <button
            type="button"
            onClick={generate}
            className="mt-3 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground hover:border-ink/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
          >
            Retry
          </button>
        </div>
      ) : null}

      {state === "generated" && suggestion ? (
        <div className="mt-3">
          {/* Triage suggestions */}
          <div className="grid gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 sm:grid-cols-2">
            <SuggestionRow
              label="Suggested priority"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT_CLASS[suggestion.suggestedPriority]}`}
                  />
                  {PRIORITY_LABELS[suggestion.suggestedPriority]}
                </span>
              }
              applied={priorityMatches}
              disabled={priorityMatches || isApplying}
              onApply={() =>
                apply({ priority: suggestion.suggestedPriority })
              }
            />
            <SuggestionRow
              label="Suggested category"
              value={CATEGORY_LABELS[suggestion.suggestedCategory]}
              applied={categoryMatches}
              disabled={categoryMatches || isApplying}
              onApply={() =>
                apply({ category: suggestion.suggestedCategory })
              }
            />
          </div>

          {applyError ? (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {applyError}
            </p>
          ) : null}

          {suggestion.reasoning ? (
            <p className="mt-3 text-xs leading-relaxed text-muted">
              <span className="font-medium text-foreground/70">Reasoning:</span>{" "}
              {suggestion.reasoning}{" "}
              <span className="text-faint">
                (confidence: {suggestion.confidence})
              </span>
            </p>
          ) : null}

          {suggestion.relatedGuidelines.length > 0 ? (
            <div className="mt-3">
              <span className="text-xs font-medium text-foreground/70">
                Related guidelines
              </span>
              <ul className="mt-1 flex flex-col gap-1">
                {suggestion.relatedGuidelines.map((g) => (
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
            </div>
          ) : null}

          {/* Reply draft */}
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={12}
            aria-label="AI suggested reply draft"
            className="mt-3 w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus:border-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground hover:border-ink/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
            >
              {copyState === "copied"
                ? "Copied"
                : copyState === "failed"
                  ? "Copy failed — select & copy manually"
                  : "Copy"}
            </button>
            <button
              type="button"
              onClick={insert}
              disabled={inserted}
              className="rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground hover:border-ink/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inserted ? "Inserted" : "Insert as reply"}
            </button>
            <button
              type="button"
              onClick={generate}
              className="ml-auto rounded-xl px-3 py-2 text-sm font-medium text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
            >
              Regenerate
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SuggestionRow({
  label,
  value,
  applied,
  disabled,
  onApply,
}: {
  label: string;
  value: React.ReactNode;
  applied: boolean;
  disabled: boolean;
  onApply: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs text-faint">{label}</div>
        <div className="mt-0.5 text-sm text-foreground">{value}</div>
      </div>
      <button
        type="button"
        onClick={onApply}
        disabled={disabled}
        className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:border-ink/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {applied ? "Applied" : "Apply"}
      </button>
    </div>
  );
}
