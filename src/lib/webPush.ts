/**
 * Web Push for Cloudflare Workers with Web Crypto only (no Node libraries):
 * VAPID authentication (RFC 8292) and aes128gcm payload encryption (RFC 8291).
 */

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string; // base64url, the browser's ECDH public key (65 bytes, uncompressed)
  auth: string; // base64url, 16-byte auth secret
}

export interface VapidKeys {
  publicKey: string; // base64url, 65-byte uncompressed P-256 point
  privateKey: string; // base64url, 32-byte private scalar
  subject: string; // mailto: or https: contact
}

const encoder = new TextEncoder();

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource }, key, length * 8);
  return new Uint8Array(bits);
}

/** RFC 8291 aes128gcm: encrypts `payload` for one subscription. */
export async function encryptPayload(
  payload: Uint8Array,
  subscription: Pick<PushSubscriptionKeys, "p256dh" | "auth">,
  { salt = crypto.getRandomValues(new Uint8Array(16)), serverKeys }: { salt?: Uint8Array; serverKeys?: CryptoKeyPair } = {},
): Promise<Uint8Array> {
  const uaPublic = base64UrlDecode(subscription.p256dh);
  const authSecret = base64UrlDecode(subscription.auth);
  const asKeys =
    serverKeys ?? ((await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", asKeys.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic as BufferSource, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asKeys.privateKey, 256));

  const keyInfo = concat(encoder.encode("WebPush: info\0"), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, shared, keyInfo, 32);
  const cek = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);

  const aesKey = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, ["encrypt"]);
  const plaintext = concat(payload, new Uint8Array([2])); // 0x02: last (and only) record, no padding
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce as BufferSource }, aesKey, plaintext as BufferSource));

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096);
  return concat(salt, recordSize, new Uint8Array([asPublic.length]), asPublic, ciphertext);
}

/** RFC 8292 VAPID: a signed JWT for the push service's origin. */
export async function vapidAuthorization(endpoint: string, keys: VapidKeys, now: Date = new Date()): Promise<string> {
  const publicKey = base64UrlDecode(keys.publicKey);
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(publicKey.slice(1, 33)),
    y: base64UrlEncode(publicKey.slice(33, 65)),
    d: keys.privateKey,
    ext: true,
  };
  const signingKey = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = base64UrlEncode(
    encoder.encode(
      JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(now.getTime() / 1000) + 12 * 3600, sub: keys.subject }),
    ),
  );
  const unsigned = `${header}.${claims}`;
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, signingKey, encoder.encode(unsigned) as BufferSource),
  );
  return `vapid t=${unsigned}.${base64UrlEncode(signature)}, k=${keys.publicKey}`;
}

export type PushResult = "sent" | "gone" | "failed";

/** Sends one push. "gone" (404/410) means the subscription should be deleted. */
export async function sendPush(
  subscription: PushSubscriptionKeys,
  payload: unknown,
  keys: VapidKeys,
  { ttlSeconds = 3600, fetcher = fetch }: { ttlSeconds?: number; fetcher?: typeof fetch } = {},
): Promise<PushResult> {
  const body = await encryptPayload(encoder.encode(JSON.stringify(payload)), subscription);
  const response = await fetcher(subscription.endpoint, {
    method: "POST",
    headers: {
      authorization: await vapidAuthorization(subscription.endpoint, keys),
      "content-encoding": "aes128gcm",
      "content-type": "application/octet-stream",
      ttl: String(ttlSeconds),
      urgency: "high",
    },
    body: body as BodyInit,
  });
  if (response.status === 404 || response.status === 410) return "gone";
  return response.ok ? "sent" : "failed";
}
