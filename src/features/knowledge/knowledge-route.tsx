"use client";

import {
  PROVINCES,
  PROVINCE_CAPITALS,
  PROVINCE_NEIGHBORS,
  PROVINCE_PLATE_PREFIXES,
} from "@/domain/geography/data/provinces";
import { PROVINCE_GROUPS } from "@/domain/geography/data/geographic-groups";
import KnowledgeBase from "@/features/knowledge/knowledge-base";
import type { KnowledgeCategoryId } from "@/features/knowledge/data/knowledge-data";

export default function KnowledgeRoute({
  categoryId = null,
}: {
  categoryId?: KnowledgeCategoryId | null;
}) {
  return (
    <KnowledgeBase
      categoryId={categoryId}
      provinces={PROVINCES}
      provinceCapitals={PROVINCE_CAPITALS}
      provinceNeighbors={PROVINCE_NEIGHBORS}
      provincePlatePrefixes={PROVINCE_PLATE_PREFIXES}
      provinceGroups={PROVINCE_GROUPS}
    />
  );
}
