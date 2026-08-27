"use client";

import { useEffect, useState } from "react";

// Re-renders every intervalMs so "Updated 2 min ago" and elapsed timers keep moving.
export function useNow(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
