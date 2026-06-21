// Server-side runtime validation for ticket writes.
//
// Server Actions are public endpoints at runtime: a direct caller can bypass the
// client form, send oversized strings, or pass invalid enum / transition values.
// These validators run inside the actions (see src/app/actions.ts) so writes are
// guarded regardless of the client. Dependency-free on purpose (decision: keep the
// MVP without a validation library); they reuse the existing union constants from
// ticket-utils so the allowed values stay in one place.

import {
  CATEGORY_ORDER,
  PRIORITY_ORDER,
  STATUS_ORDER,
} from "./ticket-utils";
import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "./types";

// Length caps. Generous enough for real input, tight enough to reject abuse.
export const LIMITS = {
  name: 120,
  email: 254, // RFC 5321 max
  title: 200,
  description: 5000,
  assignee: 120,
  note: 5000,
} as const;

/** Thrown when a Server Action receives invalid input. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// Simple, permissive email shape check (one @, a dot in the domain, no spaces).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string.`);
  }
  return value;
}

/** Trim, require non-empty, and enforce a max length. Returns the trimmed value. */
function requireText(value: unknown, field: string, max: number): string {
  const trimmed = requireString(value, field).trim();
  if (!trimmed) throw new ValidationError(`${field} is required.`);
  if (trimmed.length > max) {
    throw new ValidationError(`${field} must be ${max} characters or fewer.`);
  }
  return trimmed;
}

export function isTicketStatus(value: unknown): value is TicketStatus {
  return (
    typeof value === "string" &&
    (STATUS_ORDER as string[]).includes(value)
  );
}

export function isTicketPriority(value: unknown): value is TicketPriority {
  return (
    typeof value === "string" &&
    (PRIORITY_ORDER as string[]).includes(value)
  );
}

export function isTicketCategory(value: unknown): value is TicketCategory {
  return (
    typeof value === "string" &&
    (CATEGORY_ORDER as string[]).includes(value)
  );
}

export type ValidatedCreateInput = {
  requesterName: string;
  requesterEmail: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
};

/** Validate + normalize create-ticket input. Throws ValidationError on bad data. */
export function validateCreateTicketInput(input: unknown): ValidatedCreateInput {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Ticket input must be an object.");
  }
  const raw = input as Record<string, unknown>;

  const requesterEmail = requireText(
    raw.requesterEmail,
    "Email",
    LIMITS.email,
  ).toLowerCase();
  if (!EMAIL_RE.test(requesterEmail)) {
    throw new ValidationError("Email must be a valid email address.");
  }

  if (!isTicketCategory(raw.category)) {
    throw new ValidationError("Category is not a valid option.");
  }
  if (!isTicketPriority(raw.priority)) {
    throw new ValidationError("Priority is not a valid option.");
  }

  return {
    requesterName: requireText(raw.requesterName, "Name", LIMITS.name),
    requesterEmail,
    title: requireText(raw.title, "Title", LIMITS.title),
    category: raw.category,
    priority: raw.priority,
    description: requireText(raw.description, "Description", LIMITS.description),
  };
}

/** Validate a ticket id (non-empty, bounded). */
export function validateTicketId(value: unknown): string {
  return requireText(value, "Ticket id", 64);
}

/** Validate a status value, throwing if it is not a known status. */
export function validateStatus(value: unknown, field = "Status"): TicketStatus {
  if (!isTicketStatus(value)) {
    throw new ValidationError(`${field} is not a valid option.`);
  }
  return value;
}

/**
 * Validate an assignee. Empty string means "unassigned". Free text is allowed
 * (existing tickets may have assignees outside the TECHNICIANS list), but it is
 * trimmed and length-capped.
 */
export function validateAssignee(value: unknown): string {
  const str = requireString(value, "Assignee").trim();
  if (str.length > LIMITS.assignee) {
    throw new ValidationError(
      `Assignee must be ${LIMITS.assignee} characters or fewer.`,
    );
  }
  return str;
}

/** Validate note / reply body text (non-empty, length-capped). */
export function validateNoteContent(value: unknown, field = "Note"): string {
  return requireText(value, field, LIMITS.note);
}
