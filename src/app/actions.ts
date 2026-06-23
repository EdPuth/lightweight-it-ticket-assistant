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
import { requireProfile, requireRole } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/ticket-utils";
import {
  validateAssignee,
  validateCreateTicketInput,
  validateNoteContent,
  validateStatus,
  validateTicketId,
} from "@/lib/validation";
import type { TicketCategory, TicketPriority } from "@/lib/types";

export type CreateTicketInput = {
  requesterName: string;
  requesterEmail: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
};

// Create a ticket owned by the current user, log a "created" activity, then go
// to its detail page. Any signed-in role may create (employees create own).
export async function createTicketAction(input: CreateTicketInput) {
  const profile = await requireProfile();
  // Server Actions are public endpoints: validate before trusting the input.
  const data = validateCreateTicketInput(input);
  const id = await insertTicket({
    ...data,
    status: "open",
    // Ownership is stamped from the session, never the client.
    requesterUserId: profile.id,
  });
  await insertActivity(id, {
    type: "created",
    author: profile.displayName,
    content: "Ticket created.",
  });
  revalidatePath("/");
  redirect(`/tickets/${id}`);
}

// `next` is the only value trusted from the client. The previous status is read
// from the DB so the timeline copy can't be faked by a direct caller.
export async function changeStatusAction(ticketId: string, next: string) {
  const profile = await requireRole("it_support", "admin");
  const id = validateTicketId(ticketId);
  const to = validateStatus(next, "Status");

  const current = await getTicketFields(id);
  if (!current) throw new Error("Ticket not found.");
  if (current.status === to) return;

  await updateTicketFields(id, { status: to });
  await insertActivity(id, {
    type: "status_changed",
    author: profile.displayName,
    content: `Status changed from ${STATUS_LABELS[current.status]} to ${STATUS_LABELS[to]}.`,
  });
  revalidatePath("/");
  revalidatePath(`/tickets/${id}`);
}

export async function assignAction(ticketId: string, next: string) {
  const profile = await requireRole("it_support", "admin");
  const id = validateTicketId(ticketId);
  const to = validateAssignee(next);

  const current = await getTicketFields(id);
  if (!current) throw new Error("Ticket not found.");
  if (current.assignedTo === to) return;

  await updateTicketFields(id, { assignedTo: to || null });
  await insertActivity(id, {
    type: "note",
    author: profile.displayName,
    content: to ? `Assigned to ${to}.` : "Unassigned.",
  });
  revalidatePath("/");
  revalidatePath(`/tickets/${id}`);
}

export async function addNoteAction(ticketId: string, content: string) {
  const profile = await requireRole("it_support", "admin");
  const id = validateTicketId(ticketId);
  const trimmed = validateNoteContent(content, "Note");
  await insertActivity(id, {
    type: "note",
    author: profile.displayName,
    content: trimmed,
  });
  revalidatePath(`/tickets/${id}`);
}

export async function insertReplyAction(ticketId: string, content: string) {
  const profile = await requireRole("it_support", "admin");
  const id = validateTicketId(ticketId);
  const trimmed = validateNoteContent(content, "Reply");
  await insertActivity(id, {
    type: "reply",
    author: profile.displayName,
    content: trimmed,
  });
  revalidatePath(`/tickets/${id}`);
}

// Permanently delete a ticket (activities cascade) and return to the dashboard.
// Admin only.
export async function deleteTicketAction(ticketId: string) {
  await requireRole("admin");
  const id = validateTicketId(ticketId);
  await deleteTicket(id);
  revalidatePath("/");
  redirect("/");
}
