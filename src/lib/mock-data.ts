import type {
  FarmIdentity,
  HistoryPoint,
  HistoryRange,
  TelemetrySnapshot,
  TrayLane,
  TrayState,
  TrayUnit,
} from "@/lib/types";

export const HISTORY_RANGE_HOURS: Record<HistoryRange, number> = {
  "24h": 24,
  "72h": 72,
  "7d": 168,
};

export const FARMS: FarmIdentity[] = [
  {
    id: "atlas-north",
    name: "Atlas Canopy North",
    zone: "Brooklyn Stack A",
    deviceLabel: "ESP32 Mesh A1",
    deviceCount: 12,
    cultivarFocus: "Butterhead + Kale",
    connectionState: "online",
  },
  {
    id: "delta-east",
    name: "Delta Array East",
    zone: "Queens Corridor B",
    deviceLabel: "ESP32 Mesh B4",
    deviceCount: 9,
    cultivarFocus: "Basil + Mint",
    connectionState: "online",
  },
  {
    id: "nova-west",
    name: "Nova Grow West",
    zone: "Jersey Module C",
    deviceLabel: "ESP32 Mesh C2",
    deviceCount: 11,
    cultivarFocus: "Romaine + Arugula",
    connectionState: "online",
  },
];

const trayCultivars = [
  "Butterhead",
  "Lacinato Kale",
  "Thai Basil",
  "Mizuna",
  "Romaine",
  "Cilantro",
  "Baby Chard",
];

const trayStates: TrayState[] = ["Growing", "Harvesting", "Empty"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, precision = 1) {
  return Number(value.toFixed(precision));
}

function hashSeed(value: string) {
  return Array.from(value).reduce((seed, char, index) => {
    return seed + char.charCodeAt(0) * (index + 1);
  }, 0);
}

function buildSnapshot(farmId: string, phaseIndex: number, timestamp: Date): TelemetrySnapshot {
  const seed = hashSeed(farmId) % 23;
  const primaryWave = Math.sin((phaseIndex + seed) / 5.2);
  const secondaryWave = Math.cos((phaseIndex + seed) / 3.4);
  const tertiaryWave = Math.sin((phaseIndex + seed) / 1.8);

  const airTemperature = round(23.8 + primaryWave * 1.35 + tertiaryWave * 0.28 + seed * 0.02, 1);
  const humidity = round(clamp(61 + secondaryWave * 6.2 + primaryWave * 2.1, 48, 78), 0);
  const pressure = round(1011.4 + secondaryWave * 3.6 + tertiaryWave * 1.4, 1);

  const waterTemperature = round(19.4 + primaryWave * 0.8 + tertiaryWave * 0.18, 1);
  const ph = round(clamp(5.96 + tertiaryWave * 0.17 + secondaryWave * 0.04, 5.4, 6.5), 2);
  const ec = round(clamp(1.68 + secondaryWave * 0.18 + primaryWave * 0.05, 1.2, 2.3), 2);
  const level = round(clamp(74 + primaryWave * 8.5 - tertiaryWave * 3.5, 48, 96), 0);

  const lux = round(clamp(6280 + primaryWave * 980 + secondaryWave * 480, 3300, 8600), 0);

  return {
    farmId,
    timestamp: timestamp.toISOString(),
    connectionState: "online",
    air: {
      temperature: airTemperature,
      humidity,
      pressure,
    },
    water: {
      temperature: waterTemperature,
      ph,
      ec,
      level,
    },
    light: {
      lux,
    },
  };
}

export function buildHistoricalSeries(farmId: string, hours = 168): HistoryPoint[] {
  const now = Date.now();

  return Array.from({ length: hours }, (_, index) => {
    const hoursBack = hours - index - 1;
    const timestamp = new Date(now - hoursBack * 60 * 60 * 1000);
    const snapshot = buildSnapshot(farmId, index, timestamp);

    return {
      index,
      ...snapshot,
    };
  });
}

export function buildLiveTelemetry(farmId: string, frames = 30): TelemetrySnapshot[] {
  const now = Date.now();

  return Array.from({ length: frames }, (_, index) => {
    const minutesBack = frames - index - 1;
    const timestamp = new Date(now - minutesBack * 4 * 60 * 1000);
    return buildSnapshot(farmId, 200 + index, timestamp);
  });
}

function createTrayUnit(laneIndex: number, trayIndex: number): TrayUnit {
  const state = trayStates[(laneIndex + trayIndex) % trayStates.length];
  const cultivar =
    state === "Empty"
      ? "Awaiting Load"
      : trayCultivars[(laneIndex * 3 + trayIndex) % trayCultivars.length];

  return {
    id: `TR-${laneIndex + 1}${trayIndex + 1}`,
    cultivar,
    state,
    progress:
      state === "Empty"
        ? 8
        : state === "Harvesting"
          ? 84 - trayIndex * 4
          : 42 + ((laneIndex + trayIndex) % 5) * 9,
  };
}

export const TRAY_LANES: TrayLane[] = [
  {
    id: "lane-1",
    label: "Propagation Transfer",
    direction: "forward",
    speedSeconds: 24,
    trays: Array.from({ length: 7 }, (_, index) => createTrayUnit(0, index)),
  },
  {
    id: "lane-2",
    label: "Harvest Return",
    direction: "reverse",
    speedSeconds: 28,
    trays: Array.from({ length: 7 }, (_, index) => createTrayUnit(1, index)),
  },
  {
    id: "lane-3",
    label: "Growth Delivery",
    direction: "forward",
    speedSeconds: 22,
    trays: Array.from({ length: 7 }, (_, index) => createTrayUnit(2, index)),
  },
];

export function getFarmById(farmId: string) {
  return FARMS.find((farm) => farm.id === farmId) ?? FARMS[0];
}
