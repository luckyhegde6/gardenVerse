const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const BASE = ALPHABET.length;

export function generateId(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => ALPHABET[byte % BASE])
    .join('');
}

export function generateInviteCode(): string {
  return generateId(8).toUpperCase();
}

export function hashData(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function obfuscateEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  const obfuscated = visible + '*'.repeat(local.length - 2);
  return `${obfuscated}@${domain}`;
}

export function obfuscateString(value: string, visibleChars = 3): string {
  if (value.length <= visibleChars) return '*'.repeat(value.length);
  const visible = value.slice(0, visibleChars);
  return visible + '*'.repeat(value.length - visibleChars);
}
