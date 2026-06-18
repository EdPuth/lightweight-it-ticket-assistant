"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  insertActivity,
  insertTicket,
  updateTicketFields,
} from "@/lib/tickets-repo";
import { STATUS_LABELS } from "@/lib/ticket-utils";
import type { TicketCategory, TicketPriority, TicketStatus } from "@/lib/types";

const AUTHOR = "IT Support";

export type CreateTicketInput = {
  requesterName: string;
  requesterEmail: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
};

// Create a ticket, log a "created" activity, then go to its detail page.
export async function createTicketAction(input: CreateTicketInput) {
  const id = await insertTicket({ ...input, status: "open" });
  await insertActivity(id, {
    type: "created",
    author: input.requesterName,
    content: "Ticket created.",
  });
  revalidatePath("/");
  redirect(`/tickets/${id}`);
}

export async function changeStatusAction(
  ticketId: string,
  prev: TicketStatus,
  next: TicketStatus,
) {
  if (prev === next) return;
  await updateTicketFields(ticketId, { status: next });
  await insertActivity(ticketId, {
    type: "status_changed",
    author: AUTHOR,
    content: `Status changed from ${STATUS_LABELS[prev]} to ${STATUS_LABELS[next]}.`,
  });
  revalidatePath("/");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function assignAction(
  ticketId: string,
  prev: string,
  next: string,
) {
  if (prev === next) return;
  await updateTicketFields(ticketId, { assignedTo: next || null });
  await insertActivity(ticketId, {
    type: "note",
    author: AUTHOR,
    content: next ? `Assigned to ${next}.` : "Unassigned.",
  });
  revalidatePath("/");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function addNoteAction(ticketId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) return;
  await insertActivity(ticketId, {
    type: "note",
    author: AUTHOR,
    content: trimmed,
  });
  revalidatePath(`/tickets/${ticketId}`);
}

export async function insertReplyAction(ticketId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) return;
  await insertActivity(ticketId, {
    type: "reply",
    author: AUTHOR,
    content: trimmed,
  });
  revalidatePath(`/tickets/${ticketId}`);
}
