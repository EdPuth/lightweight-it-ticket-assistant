"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteTicket,
  getTicketFields,
  insertActivity,
  insertTicket,
  updateTicketFields,
} from "@/lib/tickets-repo";
import { requireSession } from "@/lib/session";
import { STATUS_LABELS } from "@/lib/ticket-utils";
import {
  validateAssignee,
  validateCreateTicketInput,
  validateNoteContent,
  validateStatus,
  validateTicketId,
} from "@/lib/validation";
import type { TicketCategory, TicketPriority } from "@/lib/types";

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
  await requireSession();
  // Server Actions are public endpoints: validate before trusting the input.
  const data = validateCreateTicketInput(input);
  const id = await insertTicket({ ...data, status: "open" });
  await insertActivity(id, {
    type: "created",
    author: data.requesterName,
    content: "Ticket created.",
  });
  revalidatePath("/");
  redirect(`/tickets/${id}`);
}

// `next` is the only value trusted from the client. The previous status is read
// from the DB so the timeline copy can't be faked by a direct caller.
export async function changeStatusAction(ticketId: string, next: string) {
  await requireSession();
  const id = validateTicketId(ticketId);
  const to = validateStatus(next, "Status");

  const current = await getTicketFields(id);
  if (!current) throw new Error("Ticket not found.");
  if (current.status === to) return;

  await updateTicketFields(id, { status: to });
  await insertActivity(id, {
    type: "status_changed",
    author: AUTHOR,
    content: `Status changed from ${STATUS_LABELS[current.status]} to ${STATUS_LABELS[to]}.`,
  });
  revalidatePath("/");
  revalidatePath(`/tickets/${id}`);
}

export async function assignAction(ticketId: string, next: string) {
  await requireSession();
  const id = validateTicketId(ticketId);
  const to = validateAssignee(next);

  const current = await getTicketFields(id);
  if (!current) throw new Error("Ticket not found.");
  if (current.assignedTo === to) return;

  await updateTicketFields(id, { assignedTo: to || null });
  await insertActivity(id, {
    type: "note",
    author: AUTHOR,
    content: to ? `Assigned to ${to}.` : "Unassigned.",
  });
  revalidatePath("/");
  revalidatePath(`/tickets/${id}`);
}

export async function addNoteAction(ticketId: string, content: string) {
  await requireSession();
  const id = validateTicketId(ticketId);
  const trimmed = validateNoteContent(content, "Note");
  await insertActivity(id, {
    type: "note",
    author: AUTHOR,
    content: trimmed,
  });
  revalidatePath(`/tickets/${id}`);
}

export async function insertReplyAction(ticketId: string, content: string) {
  await requireSession();
  const id = validateTicketId(ticketId);
  const trimmed = validateNoteContent(content, "Reply");
  await insertActivity(id, {
    type: "reply",
    author: AUTHOR,
    content: trimmed,
  });
  revalidatePath(`/tickets/${id}`);
}

// Permanently delete a ticket (activities cascade) and return to the dashboard.
export async function deleteTicketAction(ticketId: string) {
  await requireSession();
  const id = validateTicketId(ticketId);
  await deleteTicket(id);
  revalidatePath("/");
  redirect("/");
}
