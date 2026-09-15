"use client";

import {
  PROVINCES,
  PROVINCE_CAPITALS,
  PROVINCE_NEIGHBORS,
  PROVINCE_PLATE_PREFIXES,
} from "@/domain/geography/data/provinces";
import { PROVINCE_GROUPS } from "@/domain/geography/data/geographic-groups";
import KnowledgeBase from "@/features/knowledge/knowledge-base";
import { routePath } from "@/shared/lib/app-path";

export default function KnowledgeRoute() {
  return (
    <KnowledgeBase
      provinces={PROVINCES}
      provinceCapitals={PROVINCE_CAPITALS}
      provinceNeighbors={PROVINCE_NEIGHBORS}
      provincePlatePrefixes={PROVINCE_PLATE_PREFIXES}
      provinceGroups={PROVINCE_GROUPS}
      onExit={() => window.location.assign(routePath("/"))}
      onOpenAtlas={() => window.location.assign(routePath("/atlas"))}
    />
  );
}
