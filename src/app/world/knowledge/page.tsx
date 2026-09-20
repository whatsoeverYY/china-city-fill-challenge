import type { Metadata } from "next";
import WorldKnowledge from "@/features/world-knowledge/world-knowledge";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "世界地理知识",
  description: "学习 195 个国家、首都与七大洲基础知识。",
};

export default function WorldKnowledgePage() {
  return <WorldKnowledge />;
}
