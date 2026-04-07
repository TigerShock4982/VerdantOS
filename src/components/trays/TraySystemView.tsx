import type { CSSProperties } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import { TRAY_LANES } from "@/lib/mock-data";
import styles from "@/components/trays/TraySystemView.module.css";

const TRAY_FALLBACK = "\uD83E\uDDFA";

export function TraySystemView() {
  const allTrays = TRAY_LANES.flatMap((lane) => lane.trays);
  const activeCount = allTrays.filter((tray) => tray.state !== "Empty").length;
  const harvestingCount = allTrays.filter((tray) => tray.state === "Harvesting").length;

  return (
    <section className="pageSection">
      <div className={styles.hero}>
        <div>
          <span className="eyebrow">Automated transport</span>
          <h1 className="pageTitle">Tray Movement</h1>
          <p className="pageLead">
            Premium conveyor-style tray lanes with reversible flow prepared for future actuator
            control, scheduling, and real device orchestration.
          </p>
        </div>

        <div className={styles.summaryGrid}>
          <article className={`glassPanel ${styles.summaryCard}`}>
            <span className={styles.summaryLabel}>Visible trays</span>
            <strong className={styles.summaryValue}>{allTrays.length}</strong>
            <span className={styles.summaryDetail}>Seven units per lane in the demo viewport</span>
          </article>
          <article className={`glassPanel ${styles.summaryCard}`}>
            <span className={styles.summaryLabel}>Active load</span>
            <strong className={styles.summaryValue}>{activeCount}</strong>
            <span className={styles.summaryDetail}>Growing or harvesting trays in motion</span>
          </article>
          <article className={`glassPanel ${styles.summaryCard}`}>
            <span className={styles.summaryLabel}>Harvest queue</span>
            <strong className={styles.summaryValue}>{harvestingCount}</strong>
            <span className={styles.summaryDetail}>Ready for collection on the return lane</span>
          </article>
        </div>
      </div>

      <div className={styles.trackStack}>
        {TRAY_LANES.map((lane) => (
          <article key={lane.id} className={`glassPanel ${styles.trackLane}`}>
            <div className={styles.trackHeader}>
              <div>
                <span className="eyebrow">Lane {lane.id.split("-")[1]}</span>
                <h2 className={styles.trackTitle}>{lane.label}</h2>
              </div>

              <div className={styles.trackMeta}>
                <span className={styles.directionPill}>
                  {lane.direction === "forward" ? "Left to Right" : "Right to Left"}
                </span>
                <span className={styles.speedPill}>{lane.speedSeconds}s cycle</span>
              </div>
            </div>

            <div className={styles.viewport}>
              <div className={styles.railGlow} />
              <div
                className={`${styles.flow} ${
                  lane.direction === "forward" ? styles.forward : styles.reverse
                }`}
                style={{ "--duration": `${lane.speedSeconds}s` } as CSSProperties}
              >
                {lane.trays.concat(lane.trays).map((tray, index) => (
                  <div
                    key={`${lane.id}-${tray.id}-${index}`}
                    className={styles.trayCard}
                    style={
                      {
                        "--chamber-level": `${
                          tray.state === "Empty"
                            ? 28
                            : tray.state === "Harvesting"
                              ? 56
                              : 72
                        }%`,
                      } as CSSProperties
                    }
                  >
                    <div className={styles.trayVisual}>
                      <div className={styles.visualLabel}>Water chamber</div>
                      <div className={styles.chamberShell}>
                        <div className={styles.chamberWater}>
                          <span className={styles.surfaceLine} />
                          <span className={styles.surfaceGlow} />
                        </div>
                        <div className={styles.bubbleOne} />
                        <div className={styles.bubbleTwo} />
                      <AssetImage
                        src="/images/tray.png"
                        alt="Tray asset"
                        fallback={TRAY_FALLBACK}
                        className={styles.trayImage}
                        fallbackClassName={`${styles.trayImage} assetFallback`}
                      />
                      </div>
                    </div>

                    <div className={styles.trayMeta}>
                      <strong className={styles.trayId}>{tray.id}</strong>
                      <span
                        className={`${styles.stateChip} ${
                          styles[`state${tray.state.replace(/\s+/g, "")}`]
                        }`}
                      >
                        {tray.state}
                      </span>
                    </div>

                    <span className={styles.trayCultivar}>{tray.cultivar}</span>

                    <div className={styles.progressRow}>
                      <span>Cycle</span>
                      <strong>{tray.progress}%</strong>
                    </div>
                    <div className={styles.progressTrack}>
                      <span className={styles.progressFill} style={{ width: `${tray.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
