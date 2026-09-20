import type { Metadata } from "next";
import WorldHome from "@/features/world-home/world-home";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "世界地理",
  description: "通关中国篇后解锁的世界国家、首都、洲与地图挑战。",
};

export default function WorldPage() {
  return <WorldHome />;
}
