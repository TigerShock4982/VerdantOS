import type {
  FarmIdentity,
  FloatSensorState,
  HistoryPoint,
  HistoryRange,
  SensorEventPayload,
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

function createSeededRandom(seed: number) {
  let state = seed % 2147483647;

  if (state <= 0) {
    state += 2147483646;
  }

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function randomBetween(nextRandom: () => number, min: number, max: number, precision = 2) {
  return round(min + (max - min) * nextRandom(), precision);
}

function randomInteger(nextRandom: () => number, min: number, max: number) {
  return Math.round(min + (max - min) * nextRandom());
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

function mapDeviceId(farmId: string) {
  return `${farmId}-esp32-1`;
}

function buildReservoirPercent(levelFloat: FloatSensorState, nextRandom: () => number) {
  return levelFloat === 1
    ? round(68 + nextRandom() * 24, 0)
    : round(14 + nextRandom() * 26, 0);
}

export class MockSensorGenerator {
  private readonly deviceId: string;
  private sequence = 0;

  constructor(deviceId = "farm-esp32-1") {
    this.deviceId = deviceId;
  }

  generate(timestamp: Date): SensorEventPayload {
    this.sequence += 1;
    const eventSeed = hashSeed(`${this.deviceId}:${this.sequence}:${timestamp.getTime()}`);
    const nextRandom = createSeededRandom(eventSeed);

    return {
      type: "sensor",
      ts: toIsoWithOffset(timestamp),
      device: this.deviceId,
      seq: this.sequence,
      air: {
        t_c: randomBetween(nextRandom, 22.0, 26.0, 2),
        rh_pct: randomBetween(nextRandom, 45.0, 65.0, 2),
        p_hpa: randomBetween(nextRandom, 1000.0, 1015.0, 2),
      },
      water: {
        t_c: randomBetween(nextRandom, 18.0, 22.0, 2),
        ph: randomBetween(nextRandom, 5.8, 6.8, 2),
        ec_ms_cm: randomBetween(nextRandom, 1.0, 1.8, 2),
      },
      light: {
        lux: randomInteger(nextRandom, 200, 800),
      },
      level: {
        float: nextRandom() > 0.24 ? 1 : 0,
      },
    };
  }
}

function mapEventToTelemetrySnapshot(
  farmId: string,
  event: SensorEventPayload,
  nextRandom: () => number,
): TelemetrySnapshot {
  return {
    farmId,
    deviceId: event.device,
    sequence: event.seq,
    timestamp: event.ts,
    connectionState: "online",
    rawEvent: event,
    air: {
      temperature: event.air.t_c,
      humidity: event.air.rh_pct,
      pressure: event.air.p_hpa,
    },
    water: {
      temperature: event.water.t_c,
      ph: event.water.ph,
      ec: event.water.ec_ms_cm,
      level: buildReservoirPercent(event.level.float, nextRandom),
      levelFloat: event.level.float,
    },
    light: {
      lux: event.light.lux,
    },
  };
}

export function buildHistoricalSeries(farmId: string, hours = 168): HistoryPoint[] {
  const now = Date.now();
  const rawEvents = buildHistoricalSensorEvents(farmId, hours, now);

  return rawEvents.map((event, index) => ({
    index,
    ...mapEventToTelemetrySnapshot(
      farmId,
      event,
      createSeededRandom(hashSeed(`${farmId}:${event.seq}:reservoir`)),
    ),
  }));
}

export function buildLiveTelemetry(farmId: string, frames = 30): TelemetrySnapshot[] {
  return buildLiveSensorEvents(farmId, frames).map((event) =>
    mapEventToTelemetrySnapshot(
      farmId,
      event,
      createSeededRandom(hashSeed(`${farmId}:${event.seq}:reservoir`)),
    ),
  );
}

export function buildHistoricalSensorEvents(farmId: string, hours = 168, now = Date.now()) {
  const generator = new MockSensorGenerator(mapDeviceId(farmId));

  return Array.from({ length: hours }, (_, index) => {
    const hoursBack = hours - index - 1;
    const timestamp = new Date(now - hoursBack * 60 * 60 * 1000);
    return generator.generate(timestamp);
  });
}

export function buildLiveSensorEvents(farmId: string, frames = 30, now = Date.now()) {
  const generator = new MockSensorGenerator(mapDeviceId(farmId));

  return Array.from({ length: frames }, (_, index) => {
    const minutesBack = frames - index - 1;
    const timestamp = new Date(now - minutesBack * 4 * 60 * 1000);
    return generator.generate(timestamp);
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

export function getSharedTrayWaterLevel(farmId = FARMS[0].id) {
  const telemetry = buildLiveTelemetry(farmId, 1)[0];
  return clamp(telemetry.water.level, 20, 90);
}
