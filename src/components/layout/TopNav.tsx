"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { AssetImage } from "@/components/ui/AssetImage";
import styles from "@/components/layout/TopNav.module.css";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: "/images/dashboard-icon.svg",
    fallback: "🧭",
  },
  {
    href: "/history",
    label: "History",
    icon: "/images/history-icon.svg",
    fallback: "📈",
  },
  {
    href: "/trays",
    label: "Trays",
    icon: "/images/trays-icon.svg",
    fallback: "🛤️",
  },
  {
    href: "/config",
    label: "Config",
    icon: "/images/config-icon.svg",
    fallback: "⚙️",
  },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className={styles.wrap}>
      <div className={`glassPanel ${styles.bar}`}>
        <Link href="/" className={styles.brand}>
          <AssetImage
            src="/images/sprout-logo.webp"
            alt="VerdantOS logo"
            fallback="🌿"
            className={styles.logo}
            fallbackClassName={`${styles.logo} assetFallback`}
          />
          <div className={styles.brandMeta}>
            <span className="eyebrow">Vertical Farm Control</span>
            <strong className={styles.brandTitle}>VerdantOS</strong>
          </div>
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              >
                <AssetImage
                  src={item.icon}
                  alt={`${item.label} icon`}
                  fallback={item.fallback}
                  className={styles.navIcon}
                  fallbackClassName={`${styles.navIcon} assetFallback`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <span className={styles.readinessBadge}>Offline shell ready</span>
          <InstallAppButton className={styles.installButton} />
        </div>
      </div>
    </header>
  );
}
