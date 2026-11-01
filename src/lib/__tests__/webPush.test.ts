import { describe, expect, it, vi } from "vitest";

import { base64UrlDecode, base64UrlEncode, encryptPayload, sendPush, vapidAuthorization } from "@/lib/webPush";

const encoder = new TextEncoder();

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource }, key, length * 8));
}

/** The browser's side of RFC 8291, to check what the server sends can be read. */
async function decryptAsBrowser(body: Uint8Array, ua: CryptoKeyPair, uaPublic: Uint8Array, authSecret: Uint8Array) {
  const salt = body.slice(0, 16);
  const idLength = body[20]!;
  const asPublic = body.slice(21, 21 + idLength);
  const ciphertext = body.slice(21 + idLength);
  const asKey = await crypto.subtle.importKey("raw", asPublic as BufferSource, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: asKey }, ua.privateKey, 256));
  const keyInfo = new Uint8Array([...encoder.encode("WebPush: info\0"), ...uaPublic, ...asPublic]);
  const ikm = await hkdf(authSecret, shared, keyInfo, 32);
  const cek = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, ["decrypt"]);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce as BufferSource }, key, ciphertext as BufferSource));
  expect(plain[plain.length - 1]).toBe(2);
  return new TextDecoder().decode(plain.slice(0, -1));
}

async function browserSubscription() {
  const ua = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const uaPublic = new Uint8Array(await crypto.subtle.exportKey("raw", ua.publicKey));
  const authSecret = crypto.getRandomValues(new Uint8Array(16));
  return { ua, uaPublic, authSecret, keys: { p256dh: base64UrlEncode(uaPublic), auth: base64UrlEncode(authSecret) } };
}

async function vapidKeys() {
  const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const publicKey = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return { pair, keys: { publicKey: base64UrlEncode(publicKey), privateKey: jwk.d!, subject: "mailto:hello@openpulpit.app" } };
}

describe("web push", () => {
  it("encrypts a payload the browser can decrypt (RFC 8291)", async () => {
    const browser = await browserSubscription();
    const body = await encryptPayload(encoder.encode('{"title":"Pastor Ade is live"}'), browser.keys);
    expect(await decryptAsBrowser(body, browser.ua, browser.uaPublic, browser.authSecret)).toBe('{"title":"Pastor Ade is live"}');
  });

  it("signs a VAPID JWT for the push service's origin (RFC 8292)", async () => {
    const { pair, keys } = await vapidKeys();
    const header = await vapidAuthorization("https://fcm.googleapis.com/fcm/send/abc", keys, new Date("2026-11-01T00:00:00Z"));
    const [, token, k] = header.match(/^vapid t=([^,]+), k=(.+)$/)!;
    expect(k).toBe(keys.publicKey);
    const [h, c, s] = token!.split(".");
    expect(JSON.parse(new TextDecoder().decode(base64UrlDecode(c!)))).toMatchObject({ aud: "https://fcm.googleapis.com", sub: keys.subject });
    const isValid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      pair.publicKey,
      base64UrlDecode(s!) as BufferSource,
      encoder.encode(`${h}.${c}`) as BufferSource,
    );
    expect(isValid).toBe(true);
  });

  it("reports gone subscriptions so they can be deleted", async () => {
    const browser = await browserSubscription();
    const { keys } = await vapidKeys();
    const subscription = { endpoint: "https://push.example/abc", ...browser.keys };
    const gone = vi.fn(async () => new Response(null, { status: 410 }));
    const ok = vi.fn(async () => new Response(null, { status: 201 }));
    expect(await sendPush(subscription, { title: "x" }, keys, { fetcher: gone as typeof fetch })).toBe("gone");
    expect(await sendPush(subscription, { title: "x" }, keys, { fetcher: ok as typeof fetch })).toBe("sent");
    const init = ok.mock.calls[0] as unknown as [string, RequestInit];
    expect(init[1].headers).toMatchObject({ "content-encoding": "aes128gcm", urgency: "high" });
  });
});
