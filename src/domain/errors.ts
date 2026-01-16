export type QueueErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_TRANSITION"
  | "SESSION_CLOSED"
  | "EMPTY_QUEUE"
  | "SLOT_TAKEN"
  | "VALIDATION"
  | "UNAUTHORIZED";

export class QueueError extends Error {
  constructor(
    public readonly code: QueueErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "QueueError";
  }
}

export function isQueueError(err: unknown, code?: QueueErrorCode): err is QueueError {
  return err instanceof QueueError && (code === undefined || err.code === code);
}
