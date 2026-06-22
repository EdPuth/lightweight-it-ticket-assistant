// Practice-grade auth: a single hardcoded account gates the whole app.
//
// This is intentionally NOT production authentication. There is one shared
// credential, the session cookie holds a fixed opaque token (not a per-user
// signed session), and there is no password hashing or user identity. The real
// production path is still Supabase Auth + RLS (see docs/decisions.md D12 / D10).
//
// Everything here is read only on the server — in the login Server Action and in
// src/proxy.ts — so the credentials and session token are never shipped to the
// browser bundle. Values can be overridden via env vars for a deployed instance.

const AUTH_EMAIL = process.env.AUTH_EMAIL ?? "itsupport@outlook.com";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD ?? "123456";

/** Name of the session cookie set on successful login. */
export const SESSION_COOKIE = "ticket_session";

// Dev-only fallback token. It is NOT usable in production: resolveSessionToken()
// throws if AUTH_SESSION_TOKEN is unset in production, so the public default can
// never be used to forge a session on a deployed instance.
const DEV_SESSION_TOKEN = "itsa.session.v1.dev-only";

function resolveSessionToken(): string {
  const fromEnv = process.env.AUTH_SESSION_TOKEN;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SESSION_TOKEN must be set in production. Refusing to start with a " +
        "publicly-known default session token (it would be trivially forgeable).",
    );
  }
  return DEV_SESSION_TOKEN;
}

/** Opaque value stored in the session cookie. Required via env in production. */
export const SESSION_TOKEN = resolveSessionToken();

/** Session lifetime in seconds (8 hours). */
export const SESSION_MAX_AGE = 60 * 60 * 8;

/** Verify the single allowed account. Email is case-insensitive. */
export function verifyCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === AUTH_EMAIL.toLowerCase() &&
    password === AUTH_PASSWORD
  );
}

/** Whether a cookie value represents a valid signed-in session. */
export function isValidSession(value: string | undefined): boolean {
  return value === SESSION_TOKEN;
}
