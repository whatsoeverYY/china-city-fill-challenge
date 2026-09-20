import type { Metadata } from "next";
import WorldGauntletRoute from "@/features/world-gauntlet/world-gauntlet-route";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "世界地图关卡",
  description: "通过世界地图填国名和国家轮廓辨认关卡学习世界地理。",
};

export default function WorldGauntletPage() {
  return <WorldGauntletRoute />;
}
