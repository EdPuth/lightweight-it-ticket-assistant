import type { Ticket, TicketCategory } from "./types";

// ---------------------------------------------------------------------------
// Solution template library (mock "knowledge base").
//
// This is intentionally data-driven so it can grow easily and be reused later:
//   - Phase 5 uses it to compose a mock AI suggested reply (no real LLM).
//   - A future "search past solutions / knowledge base" feature can render
//     these same entries as standalone articles.
//   - A future keyword search over tickets can reuse `matchScore()`.
//
// Keywords must be SPECIFIC. A template is only selected when at least one of
// its distinctive keywords actually appears in the ticket text — category
// alone never selects a template, to avoid misleading replies. To add a new
// canned solution, append a SolutionTemplate below.
// ---------------------------------------------------------------------------

export type SolutionTemplate = {
  id: string;
  title: string;
  category: TicketCategory;
  /** Specific, lowercase phrases matched against a ticket's title + description. */
  keywords: string[];
  /** The resolution steps / reply body shown to the technician. */
  body: string;
};

export const solutionTemplates: SolutionTemplate[] = [
  {
    id: "email-ost-full",
    title: "Outlook .ost data file is full or oversized",
    category: "email",
    keywords: [".ost", "ost file", "data file", "mailbox is full", "mailbox full"],
    body: [
      "1. Close Outlook completely.",
      "2. Check the .ost size under %LOCALAPPDATA%\\Microsoft\\Outlook.",
      "3. Reduce the mailbox: empty Deleted Items and archive old mail.",
      "4. If the file is corrupt or very large, rename the .ost so Outlook rebuilds a fresh local cache on next launch.",
      "5. Reopen Outlook and let it re-sync from the server.",
    ].join("\n"),
  },
  {
    id: "email-inbox-access",
    title: "Grant a user access to another mailbox / inbox",
    category: "access",
    keywords: [
      "delegate access",
      "shared mailbox",
      "inbox access",
      "mailbox access",
      "access to a mailbox",
      "access to another",
    ],
    body: [
      "1. Confirm written approval from the mailbox owner or their manager.",
      "2. In the admin console, grant the requester the appropriate permission level (Full Access or Send As / delegate).",
      "3. Allow time for the permission to propagate (can take a few minutes).",
      "4. Ask the requester to add the mailbox in Outlook and verify they can open it.",
      "5. Record who was granted access and the approval reference in this ticket.",
    ].join("\n"),
  },
  {
    id: "email-outlook-classic-sync",
    title: "Outlook (classic) is not syncing",
    category: "email",
    keywords: [
      "not syncing",
      "send/receive",
      "send and receive",
      "outlook classic",
      "classic outlook",
      "working offline",
    ],
    body: [
      "1. Check the status bar — if it shows 'Working Offline', toggle Send/Receive > Work Offline.",
      "2. Run a manual Send/Receive (F9) and watch for errors.",
      "3. Verify network/VPN connectivity to the mail server.",
      "4. Repair the account under File > Account Settings > Repair.",
      "5. If it persists, rebuild the local cache by recreating the Outlook profile.",
    ].join("\n"),
  },
];

// Default reply skeletons per category, used when no specific template matches.
const CATEGORY_FALLBACK: Record<TicketCategory, string> = {
  email:
    "Thanks for flagging this email issue. We're looking into it and will follow up with next steps shortly.",
  network:
    "Thanks for reporting this network issue. We're investigating connectivity on our side and will update you soon.",
  hardware:
    "Thanks for the report. We'll diagnose the hardware and arrange a fix or replacement as needed.",
  software:
    "Thanks for the request. We're reviewing the software/licensing and will get back to you with next steps.",
  access:
    "Thanks for the access request. We'll confirm the necessary approval and provision access accordingly.",
  other:
    "Thanks for reaching out. We've received your request and will follow up shortly.",
};

/**
 * Count how many of a template's specific keywords appear in a ticket's
 * title + description. Pure and reusable — a future ticket keyword-search
 * can call this too. Category is deliberately NOT scored here so that a
 * shared category alone can never select a template.
 */
export function matchScore(template: SolutionTemplate, ticket: Ticket): number {
  const haystack = `${ticket.title} ${ticket.description}`.toLowerCase();
  let hits = 0;
  for (const keyword of template.keywords) {
    if (haystack.includes(keyword.toLowerCase())) hits += 1;
  }
  return hits;
}

/**
 * Return templates that genuinely match a ticket (at least one specific
 * keyword hit), best match first.
 */
export function findRelevantTemplates(ticket: Ticket): SolutionTemplate[] {
  return solutionTemplates
    .map((template) => ({ template, score: matchScore(template, ticket) }))
    .filter((entry) => entry.score >= 1)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.template);
}

/**
 * Compose a mock "AI suggested reply" from local templates. No real LLM call.
 * Picks the best-matching solution template, otherwise falls back to a
 * category-appropriate acknowledgement.
 */
export function generateSuggestedReply(ticket: Ticket): string {
  const [best] = findRelevantTemplates(ticket);
  const greeting = `Hi ${ticket.requesterName.split(" ")[0]},`;
  const closing = "Best regards,\nIT Support";

  if (best) {
    return [
      greeting,
      "",
      `Thanks for reaching out about "${ticket.title}". Here are the steps we'd suggest:`,
      "",
      best.body,
      "",
      "Let us know if any step is unclear or the issue continues.",
      "",
      closing,
    ].join("\n");
  }

  return [greeting, "", CATEGORY_FALLBACK[ticket.category], "", closing].join(
    "\n",
  );
}
