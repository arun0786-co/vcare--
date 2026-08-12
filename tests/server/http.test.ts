import { expect, test, vi } from "vitest";
import { QueueError } from "@/domain/errors";
import { handle, statusForCode } from "@/server/http";

test.each([
  ["VALIDATION", 400],
  ["UNAUTHORIZED", 401],
  ["NOT_FOUND", 404],
  ["CONFLICT", 409],
  ["INVALID_TRANSITION", 409],
  ["SESSION_CLOSED", 409],
  ["EMPTY_QUEUE", 409],
  ["SLOT_TAKEN", 409],
] as const)("%s is %i", (code, status) => {
  expect(statusForCode(code)).toBe(status);
});

const req = new Request("http://localhost/x");

test("handle passes successful responses through", async () => {
  const res = await handle(async () => Response.json({ ok: true }))(req, {});
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test("handle turns queue errors into JSON errors", async () => {
  const res = await handle(async () => {
    throw new QueueError("SLOT_TAKEN", "That slot was just taken");
  })(req, {});
  expect(res.status).toBe(409);
  expect(await res.json()).toEqual({ error: { code: "SLOT_TAKEN", message: "That slot was just taken" } });
});

test("handle rejects bad JSON bodies as 400", async () => {
  const res = await handle(async (r: Request) => Response.json(await r.json()))(
    new Request("http://localhost/x", { method: "POST", body: "{not json" }),
    {},
  );
  expect(res.status).toBe(400);
  expect((await res.json()).error.code).toBe("VALIDATION");
});

test("handle hides unexpected errors", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const res = await handle(async () => {
    throw new Error("password=hunter2 in a stack trace");
  })(req, {});
  expect(res.status).toBe(500);
  expect(await res.json()).toEqual({ error: { code: "INTERNAL", message: "Something went wrong" } });
  expect(log).toHaveBeenCalled();
  log.mockRestore();
});
