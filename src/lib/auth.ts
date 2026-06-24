import { cache } from "react";
import { getSupabaseAuth } from "./supabase/auth-server";
import type { Profile, UserRole } from "./types";

// RBAC helpers (server-only). Authentication is handled by Supabase Auth via the
// cookie-aware client; the role/profile lives in the app-owned `profiles` table.
// Reads go through the user-scoped client (governed by RLS); mutations still use
// the service-role client + these role checks — never rely on UI hiding alone.

/**
 * The signed-in user's profile (id + role + display fields), or null.
 *
 * Uses `getClaims()` instead of `getUser()`: when the Supabase project uses
 * asymmetric JWT signing keys, the token is verified locally with no network
 * round-trip (falls back to a network check otherwise). The proxy already
 * refreshed the session cookie, so we only need to read + verify it here.
 *
 * Wrapped in React `cache()` so multiple calls within one request are deduped.
 */
export const getCurrentUserProfile = cache(
  async (): Promise<Profile | null> => {
    const supabase = await getSupabaseAuth();
    const { data, error: claimsErr } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (claimsErr || !userId) return null;

    // Same user-scoped client: profiles RLS allows reading one's own row.
    const { data: row, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, role")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(`Failed to load profile: ${error.message}`);
    if (!row) return null;

    const r = row as {
      id: string;
      email: string;
      display_name: string;
      role: UserRole;
    };
    return {
      id: r.id,
      email: r.email,
      displayName: r.display_name,
      role: r.role,
    };
  },
);

/** Require a signed-in user with a profile, or throw. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Unauthorized: sign in required.");
  return profile;
}

/** Require the signed-in user to have one of the given roles, or throw. */
export async function requireRole(...roles: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) {
    throw new Error("Forbidden: insufficient permissions.");
  }
  return profile;
}

/** Employees may only view their own tickets; support/admin see all. */
export function canViewTicket(
  profile: Profile,
  ticket: { requesterUserId?: string },
): boolean {
  if (profile.role === "it_support" || profile.role === "admin") return true;
  return Boolean(ticket.requesterUserId) &&
    ticket.requesterUserId === profile.id;
}

/** Who may process a ticket (change status / assign / note / reply). */
export function canProcessTickets(profile: Profile): boolean {
  return profile.role === "it_support" || profile.role === "admin";
}

/** Who may delete a ticket. */
export function canDeleteTickets(profile: Profile): boolean {
  return profile.role === "admin";
}
