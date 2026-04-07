import { AssetImage } from "@/components/ui/AssetImage";
import styles from "@/components/config/ConfigView.module.css";

const NOTICE_FALLBACK = "\u26A0\uFE0F";

const modules = [
  {
    title: "Telemetry Ingress",
    description: "Prepared for live ESP32 payload ingestion, validation, and farm routing.",
    lines: [
      "MQTT / HTTP bridge mapping",
      "Sensor identity registry",
      "Offline queue and retry policy",
    ],
  },
  {
    title: "Tray Controls",
    description: "Reserved for actuator commands, conveyor timing, and tray allocation logic.",
    lines: [
      "Lane motion profiles",
      "Tray state transitions",
      "Operator safety interlocks",
    ],
  },
  {
    title: "Farm Parameters",
    description: "Future nutrient recipes, lighting schedules, and climate targets belong here.",
    lines: ["Photoperiod templates", "Nutrient setpoints", "Climate alert thresholds"],
  },
  {
    title: "History Retention",
    description: "Database-backed rollups and long-range analytics can connect into this module.",
    lines: ["Time-series storage", "Aggregation windows", "Export and reporting jobs"],
  },
];

export function ConfigView() {
  return (
    <section className="pageSection">
      <div className={`glassPanel ${styles.hero}`}>
        <div className={styles.heroContent}>
          <span className="eyebrow">Configuration workspace</span>
          <h1 className="pageTitle">Config</h1>
          <p className="pageLead">
            This page is intentionally staged as a polished placeholder so future farm parameters,
            device settings, and operational rules can be added without restructuring the app.
          </p>
        </div>

        <aside className={styles.noticePanel}>
          <AssetImage
            src="/images/alert-danger.webp"
            alt="Configuration readiness"
            fallback={NOTICE_FALLBACK}
            className={styles.noticeImage}
            fallbackClassName={`${styles.noticeImage} assetFallback`}
          />
          <div className={styles.noticeCopy}>
            <strong>Integration-ready</strong>
            <span>UI hooks and layout spacing are already aligned with production settings pages.</span>
          </div>
        </aside>
      </div>

      <div className={styles.grid}>
        {modules.map((module) => (
          <article key={module.title} className={`glassPanel ${styles.moduleCard}`}>
            <div className={styles.moduleHead}>
              <div>
                <span className="eyebrow">Prepared module</span>
                <h2 className={styles.moduleTitle}>{module.title}</h2>
              </div>
              <span className={styles.comingSoon}>Placeholder</span>
            </div>

            <p className={styles.moduleDescription}>{module.description}</p>

            <div className={styles.placeholderList}>
              {module.lines.map((line) => (
                <div key={line} className={styles.placeholderRow}>
                  <span className={styles.rowDot} />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <div className={styles.moduleFooter}>
              <button type="button" className={styles.ghostButton} disabled>
                Design Locked
              </button>
              <button type="button" className={styles.solidButton} disabled>
                Backend Pending
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
