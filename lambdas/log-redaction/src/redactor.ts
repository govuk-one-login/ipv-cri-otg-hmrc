import { secretsPattern } from "./regex/secrets";

export const defaultPatterns = [...secretsPattern];

export function redact(message: string): string;
export function redact(
  message: string,
  patterns: { regex: RegExp; replacement: string }[],
  includeDefault?: boolean
): string;
export function redact(
  message: string,
  patterns?: { regex: RegExp; replacement: string }[],
  includeDefault: boolean = true
): string {
  if (!patterns) {
    patterns = defaultPatterns;
  }
  if (includeDefault) {
    patterns = patterns.concat(defaultPatterns);
  }
  return patterns.reduce((redactedMessage, pattern) => {
    return redactedMessage.replaceAll(pattern.regex, pattern.replacement);
  }, message);
}
