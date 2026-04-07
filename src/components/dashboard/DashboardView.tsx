"use client";

import { useMemo, useState } from "react";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { AssetImage } from "@/components/ui/AssetImage";
import { useFarmTelemetry } from "@/hooks/useFarmTelemetry";
import { formatMetric, formatTimestamp } from "@/lib/format";
import { FARMS, getFarmById } from "@/lib/mock-data";
import styles from "@/components/dashboard/DashboardView.module.css";

export function DashboardView() {
  const [activeFarmId, setActiveFarmId] = useState(FARMS[0].id);
  const farm = getFarmById(activeFarmId);
  const { snapshot, lastUpdate, isOnline, liveStatus } = useFarmTelemetry(activeFarmId);

  const brightness = Math.min(100, Math.round((snapshot.light.lux / 7800) * 100));

  const sensorCards = useMemo(
    () => [
      {
        title: "Air",
        subtitle: "Canopy climate and atmospheric stability.",
        icon: "/images/air-icon.svg",
        fallback: "🌬️",
        accent: "cyan" as const,
        heroLabel: "Air Temperature",
        heroValue: formatMetric(snapshot.air.temperature, "°C", 1),
        trend: "Humidity and pressure remain inside cultivation band.",
        metrics: [
          {
            label: "Humidity",
            value: formatMetric(snapshot.air.humidity, "%", 0),
            hint: "Balanced vapor pressure deficit window",
            tone: "stable" as const,
          },
          {
            label: "Pressure",
            value: formatMetric(snapshot.air.pressure, "hPa", 1),
            hint: "Clean airflow profile across the stack",
            tone: "focus" as const,
          },
        ],
      },
      {
        title: "Water",
        subtitle: "Nutrient loop chemistry and reservoir condition.",
        icon: "/images/water-icon.svg",
        fallback: "💧",
        accent: "teal" as const,
        heroLabel: "Water Temperature",
        heroValue: formatMetric(snapshot.water.temperature, "°C", 1),
        trend: "Reservoir chemistry is tracking current feed targets.",
        metrics: [
          {
            label: "pH",
            value: formatMetric(snapshot.water.ph, "", 2),
            hint: "Nutrient uptake is aligned with recipe band",
            tone: "stable" as const,
          },
          {
            label: "EC",
            value: formatMetric(snapshot.water.ec, "mS/cm", 2),
            hint: "Conductivity is steady through recirculation",
            tone: "focus" as const,
          },
          {
            label: "Water Level",
            value: formatMetric(snapshot.water.level, "%", 0),
            hint: "Reserve volume ready for next tray wave",
            tone: "watch" as const,
          },
        ],
      },
      {
        title: "Light",
        subtitle: "Photonic output across the active grow canopy.",
        icon: "/images/light-icon.svg",
        fallback: "💡",
        accent: "lime" as const,
        heroLabel: "Light Intensity",
        heroValue: formatMetric(snapshot.light.lux, "lx", 0),
        trend: "Fixture banks are delivering a uniform vegetative profile.",
        metrics: [
          {
            label: "Brightness",
            value: formatMetric(brightness, "%", 0),
            hint: "Fixture output mapped from current lux response",
            tone: "stable" as const,
          },
          {
            label: "Uniformity",
            value: formatMetric(96 - Math.abs(78 - brightness) * 0.2, "%", 0),
            hint: "Cross-lane spread remains tightly controlled",
            tone: "focus" as const,
          },
        ],
      },
    ],
    [brightness, snapshot],
  );

  return (
    <section className="pageSection">
      <div className={`glassPanel ${styles.hero}`}>
        <div className={styles.identityPanel}>
          <div className={styles.logoCluster}>
            <AssetImage
              src="/images/sprout-logo.webp"
              alt="VerdantOS farm logo"
              fallback="🌿"
              className={styles.heroLogo}
              fallbackClassName={`${styles.heroLogo} assetFallback`}
            />
            <div className={styles.identityCopy}>
              <span className="eyebrow">Farm identity</span>
              <h1 className={styles.identityTitle}>{farm.name}</h1>
              <p className={styles.identitySubtitle}>
                {farm.zone} · {farm.deviceLabel} · {farm.cultivarFocus}
              </p>
            </div>
          </div>

          <div className={styles.identityStats}>
            <div className={styles.identityStat}>
              <span className={styles.identityLabel}>Sensors</span>
              <strong>{farm.deviceCount}</strong>
            </div>
            <div className={styles.identityStat}>
              <span className={styles.identityLabel}>Mode</span>
              <strong>Demo-ready</strong>
            </div>
            <div className={styles.identityStat}>
              <span className={styles.identityLabel}>Shell</span>
              <strong>{isOnline ? "Networked" : "Cached"}</strong>
            </div>
          </div>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Connection State</span>
            <div
              className={`${styles.statusValue} ${isOnline ? styles.online : styles.offline}`}
            >
              <span className="statusDot" />
              <strong>{isOnline ? "Online" : "Offline"}</strong>
            </div>
            <span className={styles.metaHint}>
              {isOnline
                ? "Gateway and telemetry bridge are reachable."
                : "PWA shell is active with the last known telemetry snapshot."}
            </span>
          </div>

          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Active Farm</span>
            <select
              className="controlSelect"
              value={activeFarmId}
              onChange={(event) => setActiveFarmId(event.target.value)}
              aria-label="Active farm selector"
            >
              {FARMS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <span className={styles.metaHint}>
              Ready to swap later with farm-level device routing.
            </span>
          </div>

          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Last Update</span>
            <strong className={styles.metaValue}>{formatTimestamp(lastUpdate)}</strong>
            <span className={styles.metaHint}>Timestamp refreshes as new telemetry cycles in.</span>
          </div>

          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Live Status</span>
            <div className={`${styles.liveBadge} ${styles[liveStatus]}`}>
              <span className="statusDot" />
              <strong>{liveStatus === "live" ? "Live Feed" : "Cached Snapshot"}</strong>
            </div>
            <span className={styles.metaHint}>
              Built for future ESP32 sensor ingestion and edge buffering.
            </span>
          </div>
        </div>
      </div>

      <div className={styles.sensorGrid}>
        {sensorCards.map((card) => (
          <SensorCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}
