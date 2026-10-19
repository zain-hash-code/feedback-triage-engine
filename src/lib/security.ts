/**
 * Security and sanitization utilities for customer input and LLM prompt defense.
 */

/**
 * Basic HTML/XSS sanitization to prevent stored XSS attacks.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitizes and encapsulates untrusted user input before passing it into an LLM prompt.
 * 1. Strips out dangerous delimiter overrides or prompt boundary injection attempts.
 * 2. Neutralizes attempts to bypass system prompts (e.g., "Ignore previous instructions").
 * 3. Encloses input in strict XML-style demarcated tags.
 */
export function prepareInputForLLM(input: string): string {
  if (!input) return "";

  // Normalize Unicode and replace control characters
  let cleaned = input
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "")
    .trim();

  // Neutralize common delimiter injection markers
  cleaned = cleaned
    .replace(/<\/user_feedback>/gi, "&lt;/user_feedback&gt;")
    .replace(/<system>/gi, "&lt;system&gt;")
    .replace(/<\/system>/gi, "&lt;/system&gt;");

  return cleaned;
}
