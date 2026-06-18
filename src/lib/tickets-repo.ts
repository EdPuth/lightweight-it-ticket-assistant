import { getSupabaseAdmin } from "./supabase/server";
import type {
  Ticket,
  TicketActivity,
  TicketActivityType,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "./types";

// Server-side data access for tickets. All functions run on the server and use
// the service-role Supabase client. Rows (snake_case) are mapped to the app's
// camelCase Ticket / TicketActivity types so the rest of the app is unchanged.

type TicketRow = {
  id: string;
  title: string;
  requester_name: string;
  requester_email: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

type ActivityRow = {
  id: string;
  ticket_id: string;
  type: TicketActivityType;
  author: string;
  content: string;
  created_at: string;
};

function mapActivity(row: ActivityRow): TicketActivity {
  return {
    id: row.id,
    type: row.type,
    author: row.author,
    content: row.content,
    createdAt: row.created_at,
  };
}

function mapTicket(row: TicketRow, activities: ActivityRow[]): Ticket {
  return {
    id: row.id,
    title: row.title,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    category: row.category,
    priority: row.priority,
    status: row.status,
    description: row.description,
    assignedTo: row.assigned_to ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    activities: activities.map(mapActivity),
  };
}

/** Fetch all tickets with their activities (timeline order). */
export async function listTickets(): Promise<Ticket[]> {
  const sb = getSupabaseAdmin();

  const [{ data: tickets, error: tErr }, { data: activities, error: aErr }] =
    await Promise.all([
      sb.from("tickets").select("*"),
      sb.from("activities").select("*").order("created_at", { ascending: true }),
    ]);

  if (tErr) throw new Error(`Failed to load tickets: ${tErr.message}`);
  if (aErr) throw new Error(`Failed to load activities: ${aErr.message}`);

  const byTicket = new Map<string, ActivityRow[]>();
  for (const a of (activities ?? []) as ActivityRow[]) {
    const list = byTicket.get(a.ticket_id) ?? [];
    list.push(a);
    byTicket.set(a.ticket_id, list);
  }

  return ((tickets ?? []) as TicketRow[]).map((t) =>
    mapTicket(t, byTicket.get(t.id) ?? []),
  );
}

/** Fetch a single ticket with its activities, or null if not found. */
export async function getTicketById(id: string): Promise<Ticket | null> {
  const sb = getSupabaseAdmin();

  const { data: ticket, error: tErr } = await sb
    .from("tickets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (tErr) throw new Error(`Failed to load ticket: ${tErr.message}`);
  if (!ticket) return null;

  const { data: activities, error: aErr } = await sb
    .from("activities")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (aErr) throw new Error(`Failed to load activities: ${aErr.message}`);

  return mapTicket(ticket as TicketRow, (activities ?? []) as ActivityRow[]);
}
