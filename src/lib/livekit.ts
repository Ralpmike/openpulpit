import "server-only";
import {
  AccessToken,
  EgressClient,
  RoomConfiguration,
  RoomServiceClient,
  TrackSource,
  WebhookReceiver,
} from "livekit-server-sdk";

/** LiveKit's HTTP API lives at the same host as its WebSocket URL. */
export function liveKitHttpUrl(wsUrl: string): string {
  return wsUrl.replace(/^ws(s?):\/\//, "http$1://");
}

export interface LiveKitConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

export function liveKitConfig(env: CloudflareEnv): LiveKitConfig {
  return { url: env.LIVEKIT_URL, apiKey: env.LIVEKIT_API_KEY, apiSecret: env.LIVEKIT_API_SECRET };
}

const TOKEN_TTL = "10m";

/**
 * Publish rights for one broadcast: microphone only (audio MVP), no
 * subscribing, no data channel (no live chat). Room = broadcast id.
 */
export async function createPublishToken(
  config: LiveKitConfig,
  input: { broadcastId: string; preacherId: string; name: string; reconnectGraceSeconds: number },
): Promise<string> {
  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: input.preacherId,
    name: input.name,
    ttl: TOKEN_TTL,
    metadata: JSON.stringify({ role: "preacher" }),
  });
  token.addGrant({
    roomJoin: true,
    room: input.broadcastId,
    canPublish: true,
    canPublishSources: [TrackSource.MICROPHONE],
    canSubscribe: false,
    canPublishData: false,
  });
  token.roomConfig = new RoomConfiguration({
    // Keep the room (and its listeners) while the preacher reconnects.
    departureTimeout: input.reconnectGraceSeconds,
    emptyTimeout: input.reconnectGraceSeconds,
  });
  return token.toJwt();
}

/** Listen-only rights: subscribe, never publish or send data. */
export async function createListenToken(
  config: LiveKitConfig,
  input: { broadcastId: string; identity: string },
): Promise<string> {
  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: input.identity,
    ttl: TOKEN_TTL,
    metadata: JSON.stringify({ role: "listener" }),
  });
  token.addGrant({
    roomJoin: true,
    room: input.broadcastId,
    canPublish: false,
    canSubscribe: true,
    canPublishData: false,
    hidden: false,
  });
  return token.toJwt();
}

export function roomService(config: LiveKitConfig) {
  return new RoomServiceClient(liveKitHttpUrl(config.url), config.apiKey, config.apiSecret);
}

export function egressClient(config: LiveKitConfig) {
  return new EgressClient(liveKitHttpUrl(config.url), config.apiKey, config.apiSecret);
}

export function webhookReceiver(config: LiveKitConfig) {
  return new WebhookReceiver(config.apiKey, config.apiSecret);
}
