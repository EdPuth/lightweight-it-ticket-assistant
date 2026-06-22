import { cookies } from "next/headers";
import { SESSION_COOKIE, isValidSession } from "./auth";

// Server-side session guard for mutating Server Actions.
//
// src/proxy.ts gates page/action requests, but Server Actions are public POST
// endpoints at runtime, so every mutation re-checks the session here too (defence
// in depth). Kept separate from auth.ts because it imports next/headers, which is
// for Server Components / Actions — not the proxy (edge) runtime that imports auth.

/** Throw if the request has no valid signed-in session. */
export async function requireSession(): Promise<void> {
  const cookieStore = await cookies();
  if (!isValidSession(cookieStore.get(SESSION_COOKIE)?.value)) {
    throw new Error("Unauthorized: sign in required.");
  }
}
