import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  KNOWLEDGE_CATEGORIES,
  type KnowledgeCategoryId,
} from "@/features/knowledge/data/knowledge-data";
import KnowledgeRoute from "@/features/knowledge/knowledge-route";

const CATEGORY_BY_ID = new Map(
  KNOWLEDGE_CATEGORIES.map((category) => [category.id, category]),
);

export const dynamicParams = false;

export function generateStaticParams() {
  return KNOWLEDGE_CATEGORIES.map((category) => ({ categoryId: category.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  const category = CATEGORY_BY_ID.get(categoryId as KnowledgeCategoryId);
  return category
    ? {
        title: `${category.title}｜地理知识馆`,
        description: category.subtitle,
      }
    : {};
}

export default async function KnowledgeCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  if (!CATEGORY_BY_ID.has(categoryId as KnowledgeCategoryId)) notFound();
  return <KnowledgeRoute categoryId={categoryId as KnowledgeCategoryId} />;
}
