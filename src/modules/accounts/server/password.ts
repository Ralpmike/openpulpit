/**
 * Password hashing with PBKDF2-SHA256 through Web Crypto: native and fast on
 * Cloudflare Workers, unlike scrypt in JavaScript. Format:
 * pbkdf2$<iterations>$<salt base64>$<hash base64>
 */
const ITERATIONS = 100_000; // the maximum Workers' Web Crypto allows
const KEY_BYTES = 32;
const SALT_BYTES = 16;

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password.normalize("NFKC")), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i]! ^ b[i]!;
  return difference === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  const [scheme, iterationsText, saltText, hashText] = hash.split("$");
  const iterations = Number(iterationsText);
  if (scheme !== "pbkdf2" || !Number.isInteger(iterations) || iterations < 1 || !saltText || !hashText) return false;
  const expected = fromBase64(hashText);
  const actual = await derive(password, fromBase64(saltText), iterations);
  return timingSafeEqual(actual, expected);
}
