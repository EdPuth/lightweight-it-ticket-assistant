// Quick connectivity check. Run with:
//   node --env-file=.env.local scripts/db-check.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log("SUPABASE_URL set:", Boolean(url), url ? `(${url})` : "");
console.log("KEY set:", Boolean(key), key ? `(${key.slice(0, 10)}…len=${key.length})` : "");

if (!url || !key) {
  console.error("Missing env. Did you fill .env.local?");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const { data, error, count } = await sb
  .from("tickets")
  .select("id, title, status", { count: "exact" })
  .order("created_at", { ascending: false })
  .limit(5);

if (error) {
  console.error("DB error:", error.message);
  process.exit(1);
}
console.log("tickets count:", count);
console.log("latest 5:", data);
