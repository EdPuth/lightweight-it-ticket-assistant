"use client";

import { useState } from "react";
import type { Ticket } from "@/lib/types";
import { generateSuggestedReply } from "@/lib/reply-templates";

type ReplyState = "idle" | "loading" | "generated";

// Mock "AI suggested reply": composes a draft from local solution templates
// (no real LLM). Clearly labelled as a draft for the technician to review.
export function AiSuggestedReply({
  ticket,
  onInsert,
}: {
  ticket: Ticket;
  onInsert: (content: string) => void;
}) {
  const [state, setState] = useState<ReplyState>("idle");
  const [draft, setDraft] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [inserted, setInserted] = useState(false);

  const generate = () => {
    setState("loading");
    setCopyState("idle");
    setInserted(false);
    // Simulate a short "thinking" delay so the loading state is visible.
    window.setTimeout(() => {
      setDraft(generateSuggestedReply(ticket));
      setState("generated");
    }, 700);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      // Surface the failure so the technician can copy manually instead.
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 2500);
    }
  };

  const insert = () => {
    onInsert(draft);
    setInserted(true);
  };

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">
          AI suggested reply
        </h2>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
          Suggested draft — review before sending
        </span>
      </div>

      {state === "idle" ? (
        <div className="mt-3">
          <p className="text-sm text-muted">
            Generate a draft reply based on this ticket&apos;s content. You can
            edit, copy, or insert it as a reply.
          </p>
          <button
            type="button"
            onClick={generate}
            className="ticket-card mt-3 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            Generate suggested reply
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

      {state === "generated" ? (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={12}
            aria-label="AI suggested reply draft"
            className="w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus:border-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
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
