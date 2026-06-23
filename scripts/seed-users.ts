// Seed the RBAC test accounts and (re)distribute existing tickets among the
// employees so per-employee isolation is demoable.
// Prereq: run supabase/migration-2026-06-23-rbac.sql first. Then run:
//   node --env-file=.env.local scripts/seed-users.ts
// Idempotent: re-running updates profiles and re-distributes tickets the same way.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

// 3 employees so each owns a distinct slice of tickets (isolation demo) + the
// two staff roles. Password is the first name + "123".
const ACCOUNTS = [
  { email: "admin@example.com", password: "admin123", displayName: "Admin User", role: "admin" },
  { email: "support@example.com", password: "support123", displayName: "IT Support", role: "it_support" },
  { email: "tom@example.com", password: "tom123", displayName: "Tom Carter", role: "employee" },
  { email: "jerry@example.com", password: "jerry123", displayName: "Jerry Lin", role: "employee" },
  { email: "mia@example.com", password: "mia123", displayName: "Mia Wong", role: "employee" },
];

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find(
      (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
    );
    if (found) return found;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}

async function ensureUser(acc) {
  let user = await findUserByEmail(acc.email);
  if (!user) {
    const { data, error } = await sb.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
    console.log(`created auth user: ${acc.email}`);
  } else {
    console.log(`auth user exists: ${acc.email}`);
  }

  const { error: pErr } = await sb.from("profiles").upsert({
    id: user.id,
    email: acc.email,
    display_name: acc.displayName,
    role: acc.role,
  });
  if (pErr) throw pErr;
  return user;
}

const idByEmail = {};
for (const acc of ACCOUNTS) {
  const user = await ensureUser(acc);
  idByEmail[acc.email] = user.id;
}

// Round-robin all existing tickets across the employees, and rewrite the
// requester display fields to match the owner so each ticket is clearly "theirs".
const employees = ACCOUNTS.filter((a) => a.role === "employee");
const { data: tickets, error: tErr } = await sb
  .from("tickets")
  .select("id")
  .order("id", { ascending: true });
if (tErr) throw tErr;

const groups = employees.map(() => []);
(tickets ?? []).forEach((t, i) => {
  groups[i % employees.length].push(t.id);
});

for (let i = 0; i < employees.length; i += 1) {
  const acc = employees[i];
  const ids = groups[i];
  if (ids.length === 0) continue;
  const { error } = await sb
    .from("tickets")
    .update({
      requester_user_id: idByEmail[acc.email],
      requester_name: acc.displayName,
      requester_email: acc.email,
    })
    .in("id", ids);
  if (error) throw error;
  console.log(`assigned ${ids.length} tickets to ${acc.email}`);
}

console.log("\nDone. Test accounts (email / password):");
for (const a of ACCOUNTS) console.log(`  ${a.role.padEnd(10)} ${a.email} / ${a.password}`);
