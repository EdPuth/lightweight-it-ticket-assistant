import { anthropic } from "@ai-sdk/anthropic";

// AI provider adapter. Swapping providers later means changing only this file:
// return a different AI SDK model here (e.g. an OpenAI or AI Gateway model) and
// the rest of the app is unchanged.
//
// The API key is read on the server only (ANTHROPIC_API_KEY) — never exposed to
// the client. Model is overridable via AI_MODEL.

const DEFAULT_MODEL = "claude-opus-4-8";

/** Whether a server-side AI key is configured. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** The configured chat model (defaults to the latest Claude Opus). */
export function getAiModel() {
  const id = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
  return anthropic(id);
}
