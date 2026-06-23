import { redirect } from "next/navigation";
import { listTickets } from "@/lib/tickets-repo";
import { getCurrentUserProfile } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard-client";

// Always fetch fresh data from the database on each request.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();
  // The proxy guarantees a Supabase session, but a signed-in user without a
  // profile row has no role — send them back to sign in.
  if (!profile) redirect("/login");

  // Employees see only their own tickets; support/admin see all.
  const tickets = await listTickets(
    profile.role === "employee" ? { ownerUserId: profile.id } : {},
  );

  return <DashboardClient tickets={tickets} profile={profile} />;
}
