// Generates supabase/seed.sql from the existing mock tickets so the database
// is seeded with the same data the MVP shipped with. Run with:
//   node scripts/gen-seed.ts > supabase/seed.sql
// (Node 23+ runs TypeScript natively via type stripping.)
import { mockTickets } from "../src/lib/mock-tickets.ts";

const q = (value: string) => `'${value.replace(/'/g, "''")}'`;
const nullable = (value?: string) => (value ? q(value) : "null");

const lines: string[] = [
  "-- Seed data generated from src/lib/mock-tickets.ts",
  "-- Paste into the Supabase SQL Editor AFTER running schema.sql.",
  "",
];

for (const t of mockTickets) {
  lines.push(
    `insert into tickets (id, title, requester_name, requester_email, category, priority, status, description, assigned_to, created_at, updated_at) values (${q(
      t.id,
    )}, ${q(t.title)}, ${q(t.requesterName)}, ${q(t.requesterEmail)}, ${q(
      t.category,
    )}, ${q(t.priority)}, ${q(t.status)}, ${q(t.description)}, ${nullable(
      t.assignedTo,
    )}, ${q(t.createdAt)}, ${q(t.updatedAt)});`,
  );
  for (const a of t.activities) {
    lines.push(
      `insert into activities (ticket_id, type, author, content, created_at) values (${q(
        t.id,
      )}, ${q(a.type)}, ${q(a.author)}, ${q(a.content)}, ${q(a.createdAt)});`,
    );
  }
  lines.push("");
}

process.stdout.write(lines.join("\n") + "\n");
