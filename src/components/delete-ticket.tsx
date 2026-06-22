"use client";

import { useState, useTransition } from "react";
import { deleteTicketAction } from "@/app/actions";

// Danger action, deliberately separated from the routine controls. Clicking
// "Delete ticket" reveals an explicit confirm step before anything is removed.
// On confirm, the Server Action deletes the ticket (activities cascade) and
// redirects to the dashboard.
export function DeleteTicket({ ticketId }: { ticketId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(() => deleteTicketAction(ticketId));
  };

  return (
    <section className="mt-10 rounded-xl border border-red-200 bg-red-50/40 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Delete ticket</h2>
          <p className="mt-0.5 text-xs text-muted">
            Permanently removes this ticket and its activity. This can&apos;t be
            undone.
          </p>
        </div>

        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="ticket-card rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(220,38,38,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          >
            Delete ticket
          </button>
        )}
      </div>
    </section>
  );
}
