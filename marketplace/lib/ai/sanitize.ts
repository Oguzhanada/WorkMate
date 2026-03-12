// ── Prompt injection sanitization ─────────────────────────────────────────────
// Cleans user-supplied strings before they are interpolated into LLM prompts.
// This is a defence-in-depth layer — Zod schema validation (length limits,
// character allow-lists) is the primary guard; this is a secondary hardening step.

/** Characters that are special in common prompt injection attempts */
const PROMPT_INJECTION_PATTERNS = [
  // Classic jailbreak openers (case-insensitive)
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)/gi,
  /forget\s+(everything|all)\s+(you\s+)?(know|were\s+told)/gi,
  /you\s+are\s+now\s+(a\s+)?(different|new|another|evil|uncensored)/gi,
  /pretend\s+(you\s+are|to\s+be)\s+(a\s+)?(different|new|evil|unrestricted)/gi,
  /act\s+as\s+(a\s+)?(different|new|evil|unrestricted|jailbroken)/gi,
  // Prompt delimiter injection
  /\[SYSTEM\]/gi,
  /\[INST\]/gi,
  /<\/?s>/gi,
  /<<SYS>>/gi,
  // HTML/template injection (irrelevant in plain text prompts, still remove)
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
];

/**
 * Sanitizes a user-supplied string for safe inclusion in an LLM prompt.
 *
 * @param input   Raw user input
 * @param maxLen  Maximum character length after sanitization (default: 500)
 * @returns       Cleaned string, truncated to maxLen
 */
export function sanitizeForPrompt(input: string, maxLen = 500): string {
  if (!input || typeof input !== 'string') return '';

  let cleaned = input;

  // Strip known injection patterns
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove angle brackets (HTML/XML tags, prompt XML)
  cleaned = cleaned.replace(/[<>]/g, '');

  // Collapse multiple whitespace/newlines to single space
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  // Enforce max length
  return cleaned.substring(0, maxLen);
}

/**
 * Sanitizes an array of strings (e.g. category lists) for prompt inclusion.
 * Each item is sanitized individually, then joined with the provided separator.
 */
export function sanitizeListForPrompt(
  items: string[],
  maxItemLen = 100,
  separator = ', '
): string {
  return items
    .map((item) => sanitizeForPrompt(item, maxItemLen))
    .filter(Boolean)
    .join(separator);
}
