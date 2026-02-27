const REDACTED = "[REDACTED]";

export function redactSecret(value: string | null | undefined): string {
  if (!value) return "";
  return REDACTED;
}

export function last4(value: string | null | undefined): string {
  if (!value) return "";
  return value.length <= 4 ? value : value.slice(-4);
}

