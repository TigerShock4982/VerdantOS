export type ConnectionState = "online" | "offline";
export type LiveStatus = "live" | "cached";
export type HistoryRange = "24h" | "72h" | "7d";
export type TrayState = "Growing" | "Harvesting" | "Empty";
export type LaneDirection = "forward" | "reverse";
export type FloatSensorState = 0 | 1;

export interface FarmIdentity {
  id: string;
  name: string;
  zone: string;
  deviceLabel: string;
  deviceCount: number;
  cultivarFocus: string;
  connectionState: ConnectionState;
}

export interface TelemetrySnapshot {
  farmId: string;
  deviceId: string;
  sequence: number;
  timestamp: string;
  connectionState: ConnectionState;
  rawEvent: SensorEventPayload;
  air: {
    temperature: number;
    humidity: number;
    pressure: number;
  };
  water: {
    temperature: number;
    ph: number;
    ec: number;
    level: number;
    levelFloat: FloatSensorState;
  };
  light: {
    lux: number;
  };
}

export interface HistoryPoint extends TelemetrySnapshot {
  index: number;
}

export interface TrayUnit {
  id: string;
  cultivar: string;
  state: TrayState;
  progress: number;
}

export interface TrayLane {
  id: string;
  label: string;
  direction: LaneDirection;
  speedSeconds: number;
  trays: TrayUnit[];
}

export interface SensorEventPayload {
  type: "sensor";
  ts: string;
  device: string;
  seq: number;
  air: {
    t_c: number;
    rh_pct: number;
    p_hpa: number;
  };
  water: {
    t_c: number;
    ph: number;
    ec_ms_cm: number;
  };
  light: {
    lux: number;
  };
  level: {
    float: FloatSensorState;
  };
}
