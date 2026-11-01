// Generates a VAPID key pair for web push.
// Run: node --experimental-strip-types scripts/vapid-keys.ts
// Put the public key in wrangler.jsonc (VAPID_PUBLIC_KEY) and the private key in a secret (VAPID_PRIVATE_KEY).
// Changing them later silently breaks every existing push subscription.
import { base64UrlDecode, base64UrlEncode } from "../src/lib/webPush.ts";

const keys = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"])) as CryptoKeyPair;
const publicKey = new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey));
const jwk = await crypto.subtle.exportKey("jwk", keys.privateKey);
console.log(`VAPID_PUBLIC_KEY=${base64UrlEncode(publicKey)}`);
console.log(`VAPID_PRIVATE_KEY=${jwk.d}`);
void base64UrlDecode;
