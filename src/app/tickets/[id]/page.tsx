import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTicketById } from "@/lib/tickets-repo";
import {
  canDeleteTickets,
  canProcessTickets,
  canViewTicket,
  getCurrentUserProfile,
} from "@/lib/auth";
import { TicketDetail } from "@/components/ticket-detail";

// Next.js 16：App Router 的 params 是 Promise，必须 await。
type TicketPageProps = {
  params: Promise<{ id: string }>;
};

// Always read fresh data from the database on each request.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: TicketPageProps): Promise<Metadata> {
  const { id } = await params;
  // Only reveal the real title to a viewer allowed to see this ticket, otherwise
  // the page metadata would leak another user's ticket title to an Employee.
  const profile = await getCurrentUserProfile();
  const ticket = profile ? await getTicketById(id) : null;
  const canView = profile && ticket && canViewTicket(profile, ticket);
  return {
    title: canView
      ? `${ticket.title} · ${ticket.id}`
      : "Ticket not found · Ticket Assistant",
  };
}

export default async function TicketDetailPage({ params }: TicketPageProps) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const ticket = await getTicketById(id);

  // Employees may only see their own tickets. Treat anything they can't view as
  // not-found so the page doesn't leak the existence of other users' tickets.
  if (!ticket || !canViewTicket(profile, ticket)) {
    return <TicketNotFound id={id} />;
  }

  return (
    <TicketDetail
      ticket={ticket}
      canProcess={canProcessTickets(profile)}
      canDelete={canDeleteTickets(profile)}
    />
  );
}

// 无效 id 的友好提示，而不是直接落到默认 404。
function TicketNotFound({ id }: { id: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded text-sm text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
      >
        <span aria-hidden="true">←</span> Back to tickets
      </Link>

      <div className="mt-10 rounded-xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
        <p className="font-serif text-xl text-foreground">Ticket not found</p>
        <p className="mt-2 text-sm text-muted">
          Ticket{" "}
          <span className="font-mono text-foreground/80">{id}</span>{" "}
          doesn&apos;t exist. It may have been removed, or the link is incorrect.
        </p>
        <Link
          href="/"
          className="ticket-card mt-6 inline-block rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-ink/20 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
