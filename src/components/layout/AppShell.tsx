import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/TopNav";
import styles from "@/components/layout/AppShell.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />
      <TopNav />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
