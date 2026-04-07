"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { buildLiveTelemetry } from "@/lib/mock-data";
import type { LiveStatus, TelemetrySnapshot } from "@/lib/types";

function storageKey(farmId: string) {
  return `verdantos:last-snapshot:${farmId}`;
}

function readStoredSnapshot(farmId: string): TelemetrySnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(storageKey(farmId));
    return value ? (JSON.parse(value) as TelemetrySnapshot) : null;
  } catch {
    return null;
  }
}

function storeSnapshot(farmId: string, snapshot: TelemetrySnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey(farmId), JSON.stringify(snapshot));
}

export function useFarmTelemetry(farmId: string) {
  const sequence = useMemo(() => buildLiveTelemetry(farmId), [farmId]);
  const latest = sequence[sequence.length - 1];
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot>(latest);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date(latest.timestamp));
  const [isOnline, setIsOnline] = useState(true);
  const indexRef = useRef(sequence.length - 1);

  useEffect(() => {
    const stored = readStoredSnapshot(farmId);
    const nextSnapshot = stored ?? latest;
    const sequenceIndex = sequence.findIndex(
      (entry) => entry.timestamp === nextSnapshot.timestamp,
    );

    indexRef.current = sequenceIndex >= 0 ? sequenceIndex : sequence.length - 1;
    setSnapshot(nextSnapshot);
    setLastUpdate(new Date(nextSnapshot.timestamp));
  }, [farmId, latest, sequence]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncNetworkState = () => {
      setIsOnline(window.navigator.onLine);
    };

    syncNetworkState();

    window.addEventListener("online", syncNetworkState);
    window.addEventListener("offline", syncNetworkState);

    return () => {
      window.removeEventListener("online", syncNetworkState);
      window.removeEventListener("offline", syncNetworkState);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      indexRef.current = (indexRef.current + 1) % sequence.length;
      const now = new Date();
      const nextSnapshot: TelemetrySnapshot = {
        ...sequence[indexRef.current],
        timestamp: now.toISOString(),
      };

      startTransition(() => {
        setSnapshot(nextSnapshot);
      });

      setLastUpdate(now);
      storeSnapshot(farmId, nextSnapshot);
    }, 4200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [farmId, isOnline, sequence]);

  const liveStatus: LiveStatus = isOnline ? "live" : "cached";

  return {
    snapshot,
    lastUpdate,
    isOnline,
    liveStatus,
  };
}
