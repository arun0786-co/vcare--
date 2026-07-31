import { Client } from "pg";
import { SESSION_CHANNEL } from "./publish";

type Listener = () => void;

interface Hub {
  client: Client | null;
  connecting: Promise<void> | null;
  listeners: Map<string, Set<Listener>>;
}

// One LISTEN connection per process, shared by every open page. Kept on globalThis
// so dev reloads do not open a new connection each time.
const g = globalThis as unknown as { vcareHub?: Hub };
const hub: Hub = (g.vcareHub ??= { client: null, connecting: null, listeners: new Map() });

const RECONNECT_MS = 2000;

function dropClient(client: Client) {
  if (hub.client !== client) return;
  hub.client = null;
  client.end().catch(() => {});
  setTimeout(() => {
    if (hub.listeners.size > 0) connect().catch((err) => console.error("[realtime] reconnect failed", err));
  }, RECONNECT_MS);
}

async function connect(): Promise<void> {
  if (hub.client) return;
  hub.connecting ??= (async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    client.on("notification", (msg) => {
      if (msg.channel !== SESSION_CHANNEL || !msg.payload) return;
      hub.listeners.get(msg.payload)?.forEach((fn) => fn());
    });
    client.on("error", (err) => {
      console.error("[realtime] listener error", err);
      dropClient(client);
    });
    client.on("end", () => dropClient(client));
    await client.connect();
    await client.query(`LISTEN ${SESSION_CHANNEL}`);
    hub.client = client;
  })().finally(() => {
    hub.connecting = null;
  });
  await hub.connecting;
}

export async function subscribeSession(sessionId: string, onChange: Listener): Promise<() => void> {
  await connect();
  let set = hub.listeners.get(sessionId);
  if (!set) {
    set = new Set();
    hub.listeners.set(sessionId, set);
  }
  set.add(onChange);
  return () => {
    set.delete(onChange);
    if (set.size === 0) hub.listeners.delete(sessionId);
  };
}

export async function closeRealtimeHub(): Promise<void> {
  hub.listeners.clear();
  const client = hub.client;
  hub.client = null;
  await client?.end();
}
