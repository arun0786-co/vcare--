import { afterEach, expect, test, vi } from "vitest";
import { api, ApiError } from "@/app/_lib/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

const stubFetch = (status: number, body?: unknown) => {
  const fetch = vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

test("sends JSON and returns the parsed body", async () => {
  const fetch = stubFetch(200, { ok: true });
  await expect(api("/api/x", { method: "POST", json: { a: 1 } })).resolves.toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledWith("/api/x", expect.objectContaining({ method: "POST", body: '{"a":1}', cache: "no-store" }));
});

test("204 resolves to undefined", async () => {
  stubFetch(204);
  await expect(api("/api/x")).resolves.toBeUndefined();
});

test("error bodies become ApiError with code and message", async () => {
  stubFetch(409, { error: { code: "CONFLICT", message: "The queue changed." } });
  const err = await api("/api/x").catch((e) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect(err).toMatchObject({ status: 409, code: "CONFLICT", message: "The queue changed." });
});

test("network failure is an OFFLINE ApiError", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
  await expect(api("/api/x")).rejects.toMatchObject({ status: 0, code: "OFFLINE" });
});
