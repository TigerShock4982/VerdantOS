"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { buildLiveTelemetry } from "@/lib/mock-data";
import type { LiveStatus, TelemetrySnapshot } from "@/lib/types";

function storageKey(farmId: string) {
  return `verdantos:v3:last-snapshot:${farmId}`;
}

function toIsoWithOffset(date: Date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const offsetRemainingMinutes = String(absoluteMinutes % 60).padStart(2, "0");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${sign}${offsetHours}:${offsetRemainingMinutes}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function normalizeSnapshot(
  farmId: string,
  storedValue: unknown,
  fallback: TelemetrySnapshot,
): TelemetrySnapshot {
  if (!isRecord(storedValue)) {
    return fallback;
  }

  const air = isRecord(storedValue.air) ? storedValue.air : {};
  const water = isRecord(storedValue.water) ? storedValue.water : {};
  const light = isRecord(storedValue.light) ? storedValue.light : {};
  const rawEvent = isRecord(storedValue.rawEvent) ? storedValue.rawEvent : {};
  const rawAir = isRecord(rawEvent.air) ? rawEvent.air : {};
  const rawWater = isRecord(rawEvent.water) ? rawEvent.water : {};
  const rawLight = isRecord(rawEvent.light) ? rawEvent.light : {};
  const rawLevel = isRecord(rawEvent.level) ? rawEvent.level : {};
  const timestamp = toStringValue(storedValue.timestamp, fallback.timestamp);
  const deviceId = toStringValue(storedValue.deviceId, fallback.deviceId);
  const sequence = toNumber(storedValue.sequence, fallback.sequence);
  const levelFloat =
    water.levelFloat === 0 || water.levelFloat === 1 ? water.levelFloat : fallback.water.levelFloat;

  return {
    farmId,
    deviceId,
    sequence,
    timestamp,
    connectionState: storedValue.connectionState === "offline" ? "offline" : "online",
    rawEvent: {
      type: "sensor",
      ts: toStringValue(rawEvent.ts, timestamp),
      device: toStringValue(rawEvent.device, deviceId),
      seq: toNumber(rawEvent.seq, sequence),
      air: {
        t_c: toNumber(rawAir.t_c, toNumber(air.temperature, fallback.air.temperature)),
        rh_pct: toNumber(rawAir.rh_pct, toNumber(air.humidity, fallback.air.humidity)),
        p_hpa: toNumber(rawAir.p_hpa, toNumber(air.pressure, fallback.air.pressure)),
      },
      water: {
        t_c: toNumber(rawWater.t_c, toNumber(water.temperature, fallback.water.temperature)),
        ph: toNumber(rawWater.ph, toNumber(water.ph, fallback.water.ph)),
        ec_ms_cm: toNumber(rawWater.ec_ms_cm, toNumber(water.ec, fallback.water.ec)),
      },
      light: {
        lux: toNumber(rawLight.lux, toNumber(light.lux, fallback.light.lux)),
      },
      level: {
        float: rawLevel.float === 0 || rawLevel.float === 1 ? rawLevel.float : levelFloat,
      },
    },
    air: {
      temperature: toNumber(air.temperature, fallback.air.temperature),
      humidity: toNumber(air.humidity, fallback.air.humidity),
      pressure: toNumber(air.pressure, fallback.air.pressure),
    },
    water: {
      temperature: toNumber(water.temperature, fallback.water.temperature),
      ph: toNumber(water.ph, fallback.water.ph),
      ec: toNumber(water.ec, fallback.water.ec),
      level: toNumber(water.level, fallback.water.level),
      levelFloat,
    },
    light: {
      lux: toNumber(light.lux, fallback.light.lux),
    },
  };
}

function readStoredSnapshot(farmId: string, fallback: TelemetrySnapshot): TelemetrySnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(storageKey(farmId));
    return value ? normalizeSnapshot(farmId, JSON.parse(value), fallback) : null;
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
    const stored = readStoredSnapshot(farmId, latest);
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
      const nextTimestamp = toIsoWithOffset(now);
      const nextSnapshot: TelemetrySnapshot = {
        ...sequence[indexRef.current],
        timestamp: nextTimestamp,
        rawEvent: {
          ...sequence[indexRef.current].rawEvent,
          ts: nextTimestamp,
        },
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
