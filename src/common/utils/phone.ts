function stripUnsupportedCharacters(rawPhone: string): string {
  const trimmed = rawPhone.trim();
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  }

  return trimmed.replace(/\D/g, '');
}

function normalizePrefix(phone: string): string {
  if (phone.startsWith('00')) {
    return `+${phone.slice(2)}`;
  }

  if (phone.startsWith('+')) {
    return phone;
  }

  if (phone.length === 9) {
    return `+998${phone}`;
  }

  if (phone.length === 12 && phone.startsWith('998')) {
    return `+${phone}`;
  }

  if (phone.length >= 8 && phone.length <= 15) {
    return `+${phone}`;
  }

  return phone;
}

export function normalizePhoneToE164(rawPhone: string): string | null {
  const stripped = stripUnsupportedCharacters(rawPhone);
  const normalized = normalizePrefix(stripped);

  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    return null;
  }

  return normalized;
}
