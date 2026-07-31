import { subscribeSession } from "./hub";

const PING_MS = 25_000;

// Server-sent events for one session. Each change only says "changed"; the page refetches
// through the normal API, so access checks stay in one place.
export function sseResponse(sessionId: string, signal: AbortSignal): Response {
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Stream already closed.
        }
      };
      const unsubscribe = await subscribeSession(sessionId, () => send("event: changed\ndata: {}\n\n"));
      const ping = setInterval(() => send(": ping\n\n"), PING_MS);
      cleanup = () => {
        clearInterval(ping);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };
      send("retry: 3000\n\n");
      if (signal.aborted) cleanup();
      else signal.addEventListener("abort", cleanup, { once: true });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
