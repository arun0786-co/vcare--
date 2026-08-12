import type { QueueErrorCode } from "@/domain/errors";

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
