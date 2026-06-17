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
// To add a new canned solution, just append a SolutionTemplate below — no
// component or generator changes required.
// ---------------------------------------------------------------------------

export type SolutionTemplate = {
  id: string;
  title: string;
  category: TicketCategory;
  /** Lowercase keywords matched against a ticket's title + description. */
  keywords: string[];
  /** The resolution steps / reply body shown to the technician. */
  body: string;
};

export const solutionTemplates: SolutionTemplate[] = [
  {
    id: "email-ost-full",
    title: "Outlook .ost data file is full or oversized",
    category: "email",
    keywords: ["ost", ".ost", "data file", "mailbox full", "storage", "outlook"],
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
      "access",
      "inbox",
      "mailbox",
      "delegate",
      "shared",
      "permission",
      "another employee",
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
      "outlook",
      "classic",
      "sync",
      "not syncing",
      "send/receive",
      "stuck",
      "offline",
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

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "have",
  "not",
]);

/**
 * Score how well a template matches a ticket (category + keyword hits).
 * Pure and reusable — a future ticket keyword-search can call this too.
 */
export function matchScore(template: SolutionTemplate, ticket: Ticket): number {
  const haystack = `${ticket.title} ${ticket.description}`.toLowerCase();
  let score = 0;
  if (template.category === ticket.category) score += 2;
  for (const keyword of template.keywords) {
    if (!keyword || STOP_WORDS.has(keyword)) continue;
    if (haystack.includes(keyword.toLowerCase())) score += 1;
  }
  return score;
}

/** Return templates relevant to a ticket, best match first (score > 0). */
export function findRelevantTemplates(ticket: Ticket): SolutionTemplate[] {
  return solutionTemplates
    .map((template) => ({ template, score: matchScore(template, ticket) }))
    .filter((entry) => entry.score > 0)
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
