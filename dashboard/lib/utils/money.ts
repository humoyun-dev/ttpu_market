export function formatMinorUnits(
  minorUnits: string,
  { currency = "UZS", decimals = 2 }: { currency?: string; decimals?: number } = {}
): string {
  const normalized = minorUnits.replace(/^0+(?=\d)/, "");
  const negative = normalized.startsWith("-");
  const digits = negative ? normalized.slice(1) : normalized;

  const padded = digits.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, -decimals);
  const fracPart = decimals === 0 ? "" : padded.slice(-decimals);

  const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const signed = negative ? `-${withSeparators}` : withSeparators;
  return decimals === 0 ? `${signed} ${currency}` : `${signed}.${fracPart} ${currency}`;
}

export function minorUnitsToDecimalString(
  minorUnits: string,
  { decimals = 2 }: { decimals?: number } = {}
): string {
  const normalized = minorUnits.replace(/^0+(?=\d)/, "");
  const negative = normalized.startsWith("-");
  const digits = negative ? normalized.slice(1) : normalized;

  const padded = digits.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, -decimals);
  const fracPart = decimals === 0 ? "" : padded.slice(-decimals);
  const signedInt = negative ? `-${intPart}` : intPart;
  return decimals === 0 ? signedInt : `${signedInt}.${fracPart}`;
}

export function parseDecimalToMinorUnits(
  amount: string,
  { decimals = 2 }: { decimals?: number } = {}
): string {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Invalid amount format");
  }

  const [intPartRaw, fracRaw = ""] = trimmed.split(".");
  if (fracRaw.length > decimals) {
    throw new Error("Too many decimal places");
  }

  const intPart = intPartRaw.replace(/^0+(?=\d)/, "");
  const fracPart = fracRaw.padEnd(decimals, "0");
  const combined = `${intPart}${fracPart}`.replace(/^0+(?=\d)/, "");
  return combined.length === 0 ? "0" : combined;
}
