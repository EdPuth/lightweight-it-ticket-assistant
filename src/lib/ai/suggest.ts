import { generateObject, jsonSchema } from "ai";
import { getAiModel, isAiConfigured } from "./provider";
import { findRelevantTemplates, generateSuggestedReply } from "../reply-templates";
import {
  findRelevantGuidelines,
  getGuidelineById,
  guidelines,
} from "../knowledge-base";
import { CATEGORY_ORDER, PRIORITY_ORDER } from "../ticket-utils";
import { isTicketCategory, isTicketPriority, LIMITS } from "../validation";
import type { Ticket, TicketCategory, TicketPriority } from "../types";

export type RelatedGuideline = { id: string; title: string };

// Keep the draft within the note/reply limit so "Insert as reply" never fails
// validation on an overlong model output.
function clampDraft(text: string): string {
  return text.length > LIMITS.note ? text.slice(0, LIMITS.note) : text;
}

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
  /** Guidelines the model (or keyword fallback) judged relevant to this ticket. */
  relatedGuidelines: RelatedGuideline[];
  /** "ai" = produced by the model; "fallback" = local template (no/failed AI). */
  source: "ai" | "fallback";
};

type RawSuggestion = {
  replyDraft: string;
  suggestedCategory: string;
  suggestedPriority: string;
  reasoning: string;
  confidence: string;
  relevantGuidelineIds: string[];
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
    "relevantGuidelineIds",
  ],
  properties: {
    replyDraft: {
      type: "string",
      maxLength: LIMITS.note,
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
    relevantGuidelineIds: {
      type: "array",
      description:
        "The ids of any guidelines (from the provided list) that are genuinely relevant to this ticket. Empty if none apply.",
      items: { type: "string", enum: guidelines.map((g) => g.id) },
    },
  },
});

// Map model-returned ids to {id, title}, dropping anything unknown.
function toRelatedGuidelines(ids: string[]): RelatedGuideline[] {
  const seen = new Set<string>();
  const out: RelatedGuideline[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const g = getGuidelineById(id);
    if (g) {
      out.push({ id: g.id, title: g.title });
      seen.add(id);
    }
  }
  return out;
}

function localFallback(ticket: Ticket): TicketSuggestion {
  return {
    replyDraft: clampDraft(generateSuggestedReply(ticket)),
    suggestedCategory: ticket.category,
    suggestedPriority: ticket.priority,
    reasoning:
      "AI is not configured or was unavailable — this draft comes from local templates, and the suggested category/priority repeat the ticket's current values.",
    confidence: "low",
    // Fall back to keyword matching for related guidelines.
    relatedGuidelines: findRelevantGuidelines(ticket).map((g) => ({
      id: g.id,
      title: g.title,
    })),
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

    // Full FAQ guideline catalog: the model uses it BOTH to write a better
    // reply (RAG context) AND to pick which guidelines are relevant
    // (relevantGuidelineIds). Small enough to send in full at this scale.
    const guidelineCatalog = guidelines
      .map((g) => {
        const steps = g.sections
          .map((s) => `  ${s.heading}: ${s.steps.join(" ")}`)
          .join("\n");
        return `[id: ${g.id}] ${g.title}\nSummary: ${g.summary}\n${steps}`;
      })
      .join("\n\n");

    const system =
      "You are an IT support assistant. Draft a concise, professional reply to the " +
      "requester and suggest the best category and priority for triage. Use only the " +
      "allowed category and priority values. Use the provided guidelines and known " +
      "solutions when they fit the issue, and list the ids of any genuinely relevant " +
      "guidelines in relevantGuidelineIds. Do not invent account details or make " +
      "promises about timelines.";

    const prompt = [
      `Ticket: ${ticket.id}`,
      `Title: ${ticket.title}`,
      `Requester: ${ticket.requesterName}`,
      `Current category: ${ticket.category} | current priority: ${ticket.priority}`,
      "",
      "Description:",
      ticket.description,
      `\nIT support guidelines (pick relevant ids and use their steps if applicable):\n${guidelineCatalog}`,
      kb ? `\nOther known solutions that may apply:\n${kb}` : "",
      "",
      `Allowed categories: ${CATEGORY_ORDER.join(", ")}`,
      `Allowed priorities: ${PRIORITY_ORDER.join(", ")}`,
    ].join("\n");

    const { object } = await generateObject({
      model: getAiModel(),
      schema: suggestionSchema,
      maxOutputTokens: 2048,
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
      replyDraft: clampDraft(
        object.replyDraft?.trim() || generateSuggestedReply(ticket),
      ),
      suggestedCategory,
      suggestedPriority,
      reasoning: object.reasoning?.trim() || "",
      confidence,
      relatedGuidelines: toRelatedGuidelines(object.relevantGuidelineIds ?? []),
      source: "ai",
    };
  } catch (err) {
    console.error("AI suggestion failed; using local fallback:", err);
    return localFallback(ticket);
  }
}
