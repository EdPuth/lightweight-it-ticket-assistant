import { getSupabaseAuth } from "./supabase/auth-server";
import { getSupabaseAdmin } from "./supabase/server";
import type { Profile, UserRole } from "./types";

// RBAC helpers (server-only). Authentication is handled by Supabase Auth via the
// cookie-aware client; the role/profile lives in the app-owned `profiles` table.
// Data access uses the service-role key, so EVERY mutating Server Action and
// data-scoped read must call these checks — never rely on UI hiding alone.

/** The signed-in user's profile (id + role + display fields), or null. */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = await getSupabaseAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  if (!data) return null;

  const row = data as {
    id: string;
    email: string;
    display_name: string;
    role: UserRole;
  };
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  };
}

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
