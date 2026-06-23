import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cookie-aware Supabase client for AUTH only (sign in / sign out / read the
// current user) in Server Components and Server Actions. Uses the anon key, not
// the service-role key. Data access still goes through the service-role client in
// src/lib/supabase/server.ts, gated by explicit role checks (see src/lib/auth.ts).
//
// The proxy (src/proxy.ts) builds its own request/response-bound client because
// next/headers cookies() is not available there.
export async function getSupabaseAuth() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY env var.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. Safe to
          // ignore: the proxy refreshes the session cookies on the next request.
        }
      },
    },
  });
}
