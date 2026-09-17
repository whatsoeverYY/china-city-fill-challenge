import type { KnowledgeCategoryId } from "@/features/knowledge/data/knowledge-data";
import { routePath } from "@/shared/lib/app-path";

export function knowledgeCategoryPath(categoryId: KnowledgeCategoryId) {
  return routePath(`/knowledge/${categoryId}`);
}
