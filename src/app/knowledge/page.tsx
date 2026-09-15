import type { Metadata } from "next";
import KnowledgeRoute from "@/features/knowledge/knowledge-route";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "中国地理知识馆",
  description: "按省份、城市、车牌、名校、河流与地图技巧学习中国地理。",
};

export default function KnowledgePage() {
  return <KnowledgeRoute />;
}
