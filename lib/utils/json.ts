/** Safely parse a JSON string, returning a fallback on failure. */
export function safeParseJson(str: string): Record<string, unknown> {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
