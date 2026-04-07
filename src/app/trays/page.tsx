import type { Metadata } from "next";
import { TraySystemView } from "@/components/trays/TraySystemView";

export const metadata: Metadata = {
  title: "Trays",
};

export default function TraysPage() {
  return <TraySystemView />;
}
