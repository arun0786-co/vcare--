import { afterAll, expect, test } from "vitest";
import { closeRealtimeHub } from "@/server/realtime/hub";
import { sseResponse } from "@/server/realtime/sse";
import { at } from "../support/time";
import { setupSession } from "./fixtures";

afterAll(async () => {
  await closeRealtimeHub();
});

async function readUntil(reader: ReadableStreamDefaultReader<Uint8Array>, needle: string): Promise<string> {
  const decoder = new TextDecoder();
  let text = "";
  const deadline = Date.now() + 2000;
  while (!text.includes(needle)) {
    if (Date.now() > deadline) throw new Error(`no "${needle}" in: ${text}`);
    const { value, done } = await reader.read();
    if (done) throw new Error("stream ended");
    text += decoder.decode(value);
  }
  return text;
}

test("streams a changed event per queue change and closes on abort", async () => {
  const s = await setupSession();
  const abort = new AbortController();
  const res = sseResponse(s.sessionId, abort.signal);
  expect(res.headers.get("content-type")).toBe("text/event-stream");
  expect(res.headers.get("cache-control")).toContain("no-cache");

  const reader = res.body!.getReader();
  await readUntil(reader, "retry:");
  await s.act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:00"));
  expect(await readUntil(reader, "event: changed")).toContain("data: {}");

  abort.abort();
  expect((await reader.read()).done).toBe(true);
});
