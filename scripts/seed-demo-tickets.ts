// Seed a few demo tickets that match the FAQ guidelines (MAM + auto-reply/
// forwarding, plus one more Outlook), so the "related guideline" hint can be
// demoed for every guideline. Owned by the seeded employees.
// Run: node --env-file=.env.local scripts/seed-demo-tickets.ts
// Idempotent: skips a ticket if one with the same title already exists.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// Map employee email -> { id, displayName } from profiles.
const { data: profs, error: pErr } = await sb
  .from("profiles")
  .select("id, email, display_name")
  .eq("role", "employee");
if (pErr) throw pErr;
const byEmail = Object.fromEntries(
  (profs ?? []).map((p) => [p.email, { id: p.id, displayName: p.display_name }]),
);

const DEMO = [
  {
    owner: "tom@example.com",
    category: "software",
    priority: "medium",
    title: "Can't install the Expense app on my managed phone",
    description:
      "The Expense app won't install from the Company Portal on my MAM/Intune managed device. Could you assign the app to my account so I can install it?",
  },
  {
    owner: "jerry@example.com",
    category: "software",
    priority: "low",
    title: "Request access to the managed Salesforce mobile app",
    description:
      "I need the managed Salesforce mobile app assigned to me in Intune. It doesn't show up in Company Portal yet — please grant app access.",
  },
  {
    owner: "mia@example.com",
    category: "email",
    priority: "low",
    title: "Set up an out-of-office automatic reply for my leave",
    description:
      "I'm on annual leave next week. Please help me configure an automatic reply (out of office) in Outlook with separate internal and external messages.",
  },
  {
    owner: "tom@example.com",
    category: "email",
    priority: "medium",
    title: "Forward my email to a colleague while I'm away",
    description:
      "Can you set up email forwarding so my incoming mail is forwarded to my colleague during my vacation? Keep a copy in my mailbox if possible.",
  },
];

for (const t of DEMO) {
  const owner = byEmail[t.owner];
  if (!owner) {
    console.warn(`skip "${t.title}" — no employee ${t.owner} (run seed-users first)`);
    continue;
  }

  const { data: existing } = await sb
    .from("tickets")
    .select("id")
    .eq("title", t.title)
    .maybeSingle();
  if (existing) {
    console.log(`exists, skip: ${existing.id} "${t.title}"`);
    continue;
  }

  const { data: created, error: cErr } = await sb
    .from("tickets")
    .insert({
      title: t.title,
      requester_name: owner.displayName,
      requester_email: t.owner,
      requester_user_id: owner.id,
      category: t.category,
      priority: t.priority,
      status: "open",
      description: t.description,
    })
    .select("id")
    .single();
  if (cErr) throw cErr;

  const { error: aErr } = await sb.from("activities").insert({
    ticket_id: created.id,
    type: "created",
    author: owner.displayName,
    content: "Ticket created.",
  });
  if (aErr) throw aErr;

  console.log(`created ${created.id} "${t.title}" (owner ${t.owner})`);
}

console.log("\nDone.");
