import type { Ticket, TicketCategory } from "./types";

// Staff-facing FAQ / guideline knowledge base.
//
// Data-driven on purpose (no DB, no CMS in v1): add a Guideline below and it
// shows up in the FAQ index, the detail page, and the ticket-detail "related
// guideline" hint. The same data can later feed AI prompt context — keep the
// fields generic (id / title / summary / category / keywords / sections).

export type GuidelineSection = {
  heading: string;
  steps: string[];
};

export type Guideline = {
  id: string;
  title: string;
  summary: string;
  category: TicketCategory;
  /** Specific, lowercase phrases matched against a ticket's title + description. */
  keywords: string[];
  sections: GuidelineSection[];
};

export const guidelines: Guideline[] = [
  {
    id: "outlook-email-issues",
    title: "Troubleshooting common Outlook email issues",
    summary:
      "First steps for the most frequent Outlook problems: not syncing, a full/oversized .ost cache, and send/receive errors.",
    category: "email",
    keywords: [
      "outlook",
      ".ost",
      "ost file",
      "not syncing",
      "send/receive",
      "send and receive",
      "working offline",
      "mailbox is full",
      "mailbox full",
      "cannot expand the folder",
    ],
    sections: [
      {
        heading: "Outlook is not syncing / shows 'Working Offline'",
        steps: [
          "Check the status bar — if it says 'Working Offline', toggle Send/Receive > Work Offline.",
          "Run a manual Send/Receive (F9) and watch for any error dialog.",
          "Verify network/VPN connectivity to the mail server.",
          "Repair the account: File > Account Settings > Account Settings > Repair.",
        ],
      },
      {
        heading: "Mailbox / .ost data file is full or oversized",
        steps: [
          "Close Outlook completely.",
          "Check the .ost size under %LOCALAPPDATA%\\Microsoft\\Outlook.",
          "Reduce the mailbox: empty Deleted Items and archive old mail.",
          "If the file is corrupt or very large, rename the .ost so Outlook rebuilds a fresh local cache on next launch.",
        ],
      },
      {
        heading: "Still broken?",
        steps: [
          "Recreate the Outlook profile (Control Panel > Mail > Show Profiles).",
          "Confirm the issue is account-specific by testing in Outlook on the web.",
        ],
      },
    ],
  },
  {
    id: "mam-app-assignment",
    title: "Assigning app access in MAM (mobile app management)",
    summary:
      "How to grant a user permission to download and use a managed app on their device through the MAM/Intune console.",
    category: "software",
    keywords: [
      "mam",
      "intune",
      "app assignment",
      "assign app",
      "managed app",
      "company portal",
      "install app",
      "app access",
      "mobile app",
    ],
    sections: [
      {
        heading: "Confirm the request",
        steps: [
          "Verify the user, the exact app, and (if licensed) that a license is available.",
          "Confirm the user's device is enrolled/managed.",
        ],
      },
      {
        heading: "Assign the app",
        steps: [
          "In the management console, open Apps and select the app.",
          "Under Properties > Assignments, add the user (or their group) to the appropriate assignment (Required or Available).",
          "Save and allow time for the policy to sync to the device.",
        ],
      },
      {
        heading: "Verify with the user",
        steps: [
          "Ask the user to open the Company Portal and refresh, or wait for the next sync.",
          "Confirm the app appears and installs, then record the assignment in the ticket.",
        ],
      },
    ],
  },
  {
    id: "email-auto-reply-forwarding",
    title: "Setting up email auto-reply and forwarding",
    summary:
      "Help a user configure an automatic reply (out-of-office) and/or forward their mail to another address.",
    category: "email",
    keywords: [
      "auto-reply",
      "auto reply",
      "automatic reply",
      "out of office",
      "ooo",
      "vacation reply",
      "forwarding",
      "forward email",
      "forward mail",
    ],
    sections: [
      {
        heading: "Automatic reply (out of office)",
        steps: [
          "In Outlook: File > Automatic Replies; or in Outlook on the web: Settings > Mail > Automatic replies.",
          "Set the date range and separate internal/external messages as needed.",
          "For a shared mailbox, set the auto-reply on the mailbox itself, not the user's account.",
        ],
      },
      {
        heading: "Forwarding",
        steps: [
          "User-level: Outlook on the web > Settings > Mail > Forwarding > enable and enter the target address.",
          "Decide whether to keep a copy of forwarded messages.",
          "For external forwarding, confirm it is allowed by policy before enabling.",
        ],
      },
      {
        heading: "Wrap up",
        steps: [
          "Confirm with the user by sending a test message.",
          "Note what was enabled and any end date in the ticket.",
        ],
      },
    ],
  },
];

/** Look up a single guideline by id. */
export function getGuidelineById(id: string): Guideline | undefined {
  return guidelines.find((g) => g.id === id);
}

/** Count how many of a guideline's keywords appear in some text. */
function keywordHits(guideline: Guideline, text: string): number {
  const haystack = text.toLowerCase();
  let hits = 0;
  for (const keyword of guideline.keywords) {
    if (haystack.includes(keyword.toLowerCase())) hits += 1;
  }
  return hits;
}

/**
 * Guidelines relevant to a ticket (at least one keyword hit), best match first.
 * Reusable for the ticket-detail hint and, later, AI prompt context.
 */
export function findRelevantGuidelines(ticket: Ticket): Guideline[] {
  const text = `${ticket.title} ${ticket.description}`;
  return guidelines
    .map((guideline) => ({ guideline, score: keywordHits(guideline, text) }))
    .filter((entry) => entry.score >= 1)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.guideline);
}
