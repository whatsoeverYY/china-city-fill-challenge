import type { Metadata } from "next";
import GauntletRoute from "@/features/gauntlet/gauntlet-route";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "过关斩将",
  description: "通过城市、车牌、地图与省际关系关卡挑战中国地理知识。",
};

export default function GauntletPage() {
  return <GauntletRoute />;
}
