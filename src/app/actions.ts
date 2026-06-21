"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  insertActivity,
  insertTicket,
  updateTicketFields,
} from "@/lib/tickets-repo";
import { STATUS_LABELS } from "@/lib/ticket-utils";
import {
  validateAssignee,
  validateCreateTicketInput,
  validateNoteContent,
  validateStatus,
  validateTicketId,
} from "@/lib/validation";
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

export async function changeStatusAction(
  ticketId: string,
  prev: TicketStatus,
  next: TicketStatus,
) {
  const id = validateTicketId(ticketId);
  const from = validateStatus(prev, "Previous status");
  const to = validateStatus(next, "Status");
  if (from === to) return;
  await updateTicketFields(id, { status: to });
  await insertActivity(id, {
    type: "status_changed",
    author: AUTHOR,
    content: `Status changed from ${STATUS_LABELS[from]} to ${STATUS_LABELS[to]}.`,
  });
  revalidatePath("/");
  revalidatePath(`/tickets/${id}`);
}

export async function assignAction(
  ticketId: string,
  prev: string,
  next: string,
) {
  const id = validateTicketId(ticketId);
  const from = validateAssignee(prev);
  const to = validateAssignee(next);
  if (from === to) return;
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
  const id = validateTicketId(ticketId);
  const trimmed = validateNoteContent(content, "Reply");
  await insertActivity(id, {
    type: "reply",
    author: AUTHOR,
    content: trimmed,
  });
  revalidatePath(`/tickets/${id}`);
}
