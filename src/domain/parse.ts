import type { z } from "zod";
import { QueueError } from "./errors";

// Turns the first schema problem into a VALIDATION error with a message people can read.
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown, fallback = "Invalid request"): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new QueueError("VALIDATION", result.error.issues[0]?.message ?? fallback);
  return result.data;
}
