import { isQueueError, type QueueErrorCode } from "@/domain/errors";

const STATUS: Record<QueueErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INVALID_TRANSITION: 409,
  SESSION_CLOSED: 409,
  EMPTY_QUEUE: 409,
  SLOT_TAKEN: 409,
};

export function statusForCode(code: QueueErrorCode): number {
  return STATUS[code];
}

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

// Wraps a route handler so every failure comes back as { error: { code, message } }.
export function handle<C>(fn: (request: Request, ctx: C) => Promise<Response>) {
  return async (request: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(request, ctx);
    } catch (err) {
      if (isQueueError(err)) return errorResponse(statusForCode(err.code), err.code, err.message);
      if (err instanceof SyntaxError) return errorResponse(400, "VALIDATION", "The request body is not valid JSON");
      console.error("[api] unexpected error", err);
      return errorResponse(500, "INTERNAL", "Something went wrong");
    }
  };
}
