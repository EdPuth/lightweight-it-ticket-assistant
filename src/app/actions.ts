"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteTicket,
  getTicketById,
  getTicketFields,
  insertActivity,
  insertTicket,
  updateTicketFields,
} from "@/lib/tickets-repo";
import { requireProfile, requireRole } from "@/lib/auth";
import {
  generateTicketSuggestion,
  type TicketSuggestion,
} from "@/lib/ai/suggest";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/ticket-utils";
import {
  validateAssignee,
  validateCategory,
  validateCreateTicketInput,
  validateNoteContent,
  validatePriority,
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

// Generate an AI reply draft + category/priority suggestions for a ticket.
// Staff only; read-only (nothing is persisted until the user applies it).
export async function generateSuggestionAction(
  ticketId: string,
): Promise<TicketSuggestion> {
  await requireRole("it_support", "admin");
  const id = validateTicketId(ticketId);
  const ticket = await getTicketById(id);
  if (!ticket) throw new Error("Ticket not found.");
  return generateTicketSuggestion(ticket);
}

// Apply an AI-suggested priority and/or category to the ticket. Staff only;
// enum-validated server-side and logged to the timeline.
export async function applySuggestionAction(
  ticketId: string,
  fields: { priority?: string; category?: string },
) {
  const profile = await requireRole("it_support", "admin");
  const id = validateTicketId(ticketId);

  const patch: { priority?: TicketPriority; category?: TicketCategory } = {};
  const parts: string[] = [];
  if (fields.priority !== undefined) {
    patch.priority = validatePriority(fields.priority);
    parts.push(`priority → ${PRIORITY_LABELS[patch.priority]}`);
  }
  if (fields.category !== undefined) {
    patch.category = validateCategory(fields.category);
    parts.push(`category → ${CATEGORY_LABELS[patch.category]}`);
  }
  if (parts.length === 0) return;

  await updateTicketFields(id, patch);
  await insertActivity(id, {
    type: "note",
    author: profile.displayName,
    content: `Applied AI suggestion: ${parts.join(", ")}.`,
  });
  revalidatePath("/");
  revalidatePath(`/tickets/${id}`);
}
