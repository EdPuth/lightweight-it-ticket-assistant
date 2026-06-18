import { listTickets } from "@/lib/tickets-repo";
import { DashboardClient } from "@/components/dashboard-client";

// Always fetch fresh data from the database on each request.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tickets = await listTickets();
  return <DashboardClient tickets={tickets} />;
}
