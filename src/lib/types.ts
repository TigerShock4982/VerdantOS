export type ConnectionState = "online" | "offline";
export type LiveStatus = "live" | "cached";
export type HistoryRange = "24h" | "72h" | "7d";
export type TrayState = "Growing" | "Harvesting" | "Empty";
export type LaneDirection = "forward" | "reverse";

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
  timestamp: string;
  connectionState: ConnectionState;
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
