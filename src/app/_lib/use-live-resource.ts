"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

const POLL_MS = 60_000;
const OFFLINE_AFTER_MS = 5_000;

// Keeps a JSON resource fresh: refetches when the server says the queue changed,
// whenever the stream (re)opens, and every minute in case an event was missed.
// Refetching on open covers changes made between the page render and the stream connecting.
export function useLiveResource<T>(url: string, streamUrl: string, initial: T) {
  const [data, setData] = useState(initial);
  const [connected, setConnected] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setData(await api<T>(url));
    } catch {
      // Keep showing the last data; the staleness label tells people it is old.
    }
  }, [url]);

  useEffect(() => {
    const source = new EventSource(streamUrl);
    let offlineTimer: ReturnType<typeof setTimeout> | undefined;
    source.onopen = () => {
      clearTimeout(offlineTimer);
      setConnected(true);
      void refresh();
    };
    source.onerror = () => {
      clearTimeout(offlineTimer);
      offlineTimer = setTimeout(() => setConnected(false), OFFLINE_AFTER_MS);
    };
    source.addEventListener("changed", () => void refresh());
    const poll = setInterval(() => void refresh(), POLL_MS);
    return () => {
      source.close();
      clearInterval(poll);
      clearTimeout(offlineTimer);
    };
  }, [streamUrl, refresh]);

  return { data, setData, connected, refresh };
}
