import type { Metadata } from "next";
import AtlasRoute from "@/features/atlas/atlas-route";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "全国车牌图鉴",
  description: "浏览中国省级行政区及城市车牌地图。",
};

export default function AtlasPage() {
  return <AtlasRoute />;
}
