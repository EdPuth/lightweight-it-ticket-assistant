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
  requester_user_id: string | null;
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
    requesterUserId: row.requester_user_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    activities: activities.map(mapActivity),
  };
}

/**
 * Fetch tickets with their activities (timeline order). Pass `ownerUserId` to
 * restrict to one requester (employee view); omit it for support/admin (all).
 */
export async function listTickets(
  opts: { ownerUserId?: string } = {},
): Promise<Ticket[]> {
  const sb = getSupabaseAdmin();

  const ticketsQuery = sb.from("tickets").select("*");
  if (opts.ownerUserId) {
    ticketsQuery.eq("requester_user_id", opts.ownerUserId);
  }

  const { data: tickets, error: tErr } = await ticketsQuery;
  if (tErr) throw new Error(`Failed to load tickets: ${tErr.message}`);

  // The dashboard list (ticket cards) doesn't render activity timelines, so we
  // skip fetching activities here — one fewer query and a smaller client payload.
  return ((tickets ?? []) as TicketRow[]).map((t) => mapTicket(t, []));
}

/** Fetch a single ticket with its activities, or null if not found. */
export async function getTicketById(id: string): Promise<Ticket | null> {
  const sb = getSupabaseAdmin();

  // Fetch the ticket and its activities in parallel (one round-trip instead of
  // two sequential ones). If the ticket is missing, the activities are ignored.
  const [{ data: ticket, error: tErr }, { data: activities, error: aErr }] =
    await Promise.all([
      sb.from("tickets").select("*").eq("id", id).maybeSingle(),
      sb
        .from("activities")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (tErr) throw new Error(`Failed to load ticket: ${tErr.message}`);
  if (!ticket) return null;
  if (aErr) throw new Error(`Failed to load activities: ${aErr.message}`);

  return mapTicket(ticket as TicketRow, (activities ?? []) as ActivityRow[]);
}

/**
 * Fetch just the mutable fields of a ticket (no activities), or null if missing.
 * Used by Server Actions to read the authoritative current state instead of
 * trusting client-provided values.
 */
export async function getTicketFields(
  id: string,
): Promise<{ status: TicketStatus; assignedTo: string } | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("tickets")
    .select("status, assigned_to")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load ticket: ${error.message}`);
  if (!data) return null;

  const row = data as { status: TicketStatus; assigned_to: string | null };
  return { status: row.status, assignedTo: row.assigned_to ?? "" };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export type NewTicketInput = {
  title: string;
  requesterName: string;
  requesterEmail: string;
  requesterUserId?: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  assignedTo?: string | null;
};

/** Insert a ticket; the DB generates the TKT-#### id. Returns the new id. */
export async function insertTicket(input: NewTicketInput): Promise<string> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("tickets")
    .insert({
      title: input.title,
      requester_name: input.requesterName,
      requester_email: input.requesterEmail,
      requester_user_id: input.requesterUserId ?? null,
      category: input.category,
      priority: input.priority,
      status: input.status,
      description: input.description,
      assigned_to: input.assignedTo ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create ticket: ${error.message}`);
  return (data as { id: string }).id;
}

/** Insert an activity and bump the ticket's updated_at. */
export async function insertActivity(
  ticketId: string,
  activity: { type: TicketActivityType; author: string; content: string },
): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("activities").insert({
    ticket_id: ticketId,
    type: activity.type,
    author: activity.author,
    content: activity.content,
  });
  if (error) throw new Error(`Failed to add activity: ${error.message}`);

  // Bump updated_at so the dashboard's "recently updated" sort stays accurate.
  // Check this error too: a silent failure would leave freshness/sort metadata stale.
  const { error: bumpErr } = await sb
    .from("tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (bumpErr) {
    throw new Error(`Failed to bump ticket updated_at: ${bumpErr.message}`);
  }
}

/** Update mutable ticket fields and bump updated_at. */
export async function updateTicketFields(
  ticketId: string,
  fields: { status?: TicketStatus; assignedTo?: string | null },
): Promise<void> {
  const sb = getSupabaseAdmin();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (fields.status !== undefined) patch.status = fields.status;
  if (fields.assignedTo !== undefined) patch.assigned_to = fields.assignedTo;

  const { error } = await sb.from("tickets").update(patch).eq("id", ticketId);
  if (error) throw new Error(`Failed to update ticket: ${error.message}`);
}

/**
 * Permanently delete a ticket. The activities table has
 * `on delete cascade`, so its activities are removed too.
 */
export async function deleteTicket(ticketId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("tickets").delete().eq("id", ticketId);
  if (error) throw new Error(`Failed to delete ticket: ${error.message}`);
}
