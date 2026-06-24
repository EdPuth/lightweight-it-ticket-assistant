import { generateObject, jsonSchema } from "ai";
import { getAiModel, isAiConfigured } from "./provider";
import { findRelevantTemplates, generateSuggestedReply } from "../reply-templates";
import { CATEGORY_ORDER, PRIORITY_ORDER } from "../ticket-utils";
import { isTicketCategory, isTicketPriority } from "../validation";
import type { Ticket, TicketCategory, TicketPriority } from "../types";

// Real-AI ticket assistant (server-only). Produces a reply draft plus triage
// suggestions (category + priority) with reasoning. Falls back to the local
// template draft when AI is not configured or the call fails, so the feature
// degrades gracefully. Enum outputs are constrained by the schema AND
// re-validated server-side before they reach the UI.

export type Confidence = "low" | "medium" | "high";

export type TicketSuggestion = {
  replyDraft: string;
  suggestedCategory: TicketCategory;
  suggestedPriority: TicketPriority;
  reasoning: string;
  confidence: Confidence;
  /** "ai" = produced by the model; "fallback" = local template (no/failed AI). */
  source: "ai" | "fallback";
};

type RawSuggestion = {
  replyDraft: string;
  suggestedCategory: string;
  suggestedPriority: string;
  reasoning: string;
  confidence: string;
};

const suggestionSchema = jsonSchema<RawSuggestion>({
  type: "object",
  additionalProperties: false,
  required: [
    "replyDraft",
    "suggestedCategory",
    "suggestedPriority",
    "reasoning",
    "confidence",
  ],
  properties: {
    replyDraft: {
      type: "string",
      description:
        "A concise, professional reply to the requester. Plain text, ready to send after review.",
    },
    suggestedCategory: { type: "string", enum: [...CATEGORY_ORDER] },
    suggestedPriority: { type: "string", enum: [...PRIORITY_ORDER] },
    reasoning: {
      type: "string",
      description:
        "One or two sentences explaining the category/priority choice.",
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
  },
});

function localFallback(ticket: Ticket): TicketSuggestion {
  return {
    replyDraft: generateSuggestedReply(ticket),
    suggestedCategory: ticket.category,
    suggestedPriority: ticket.priority,
    reasoning:
      "AI is not configured or was unavailable — this draft comes from local templates, and the suggested category/priority repeat the ticket's current values.",
    confidence: "low",
    source: "fallback",
  };
}

export async function generateTicketSuggestion(
  ticket: Ticket,
): Promise<TicketSuggestion> {
  if (!isAiConfigured()) return localFallback(ticket);

  try {
    // Feed any matching known solutions in as context (keeps the KB reusable).
    const kb = findRelevantTemplates(ticket)
      .slice(0, 3)
      .map((t) => `- ${t.title}:\n${t.body}`)
      .join("\n\n");

    const system =
      "You are an IT support assistant. Draft a concise, professional reply to the " +
      "requester and suggest the best category and priority for triage. Use only the " +
      "allowed category and priority values. Prefer the provided known solutions when " +
      "they fit the issue. Do not invent account details or make promises about timelines.";

    const prompt = [
      `Ticket: ${ticket.id}`,
      `Title: ${ticket.title}`,
      `Requester: ${ticket.requesterName}`,
      `Current category: ${ticket.category} | current priority: ${ticket.priority}`,
      "",
      "Description:",
      ticket.description,
      kb ? `\nKnown solutions that may apply:\n${kb}` : "",
      "",
      `Allowed categories: ${CATEGORY_ORDER.join(", ")}`,
      `Allowed priorities: ${PRIORITY_ORDER.join(", ")}`,
    ].join("\n");

    const { object } = await generateObject({
      model: getAiModel(),
      schema: suggestionSchema,
      system,
      prompt,
    });

    // Defensive normalization: never let an unexpected enum value reach the UI.
    const suggestedCategory = isTicketCategory(object.suggestedCategory)
      ? object.suggestedCategory
      : ticket.category;
    const suggestedPriority = isTicketPriority(object.suggestedPriority)
      ? object.suggestedPriority
      : ticket.priority;
    const confidence: Confidence = (["low", "medium", "high"] as const).includes(
      object.confidence as Confidence,
    )
      ? (object.confidence as Confidence)
      : "medium";

    return {
      replyDraft: object.replyDraft?.trim() || generateSuggestedReply(ticket),
      suggestedCategory,
      suggestedPriority,
      reasoning: object.reasoning?.trim() || "",
      confidence,
      source: "ai",
    };
  } catch (err) {
    console.error("AI suggestion failed; using local fallback:", err);
    return localFallback(ticket);
  }
}
