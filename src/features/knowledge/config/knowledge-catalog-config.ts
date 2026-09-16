import { CONFUSABLE_CITY_PAIRS } from "@/domain/geography/data/confusable-cities";
import { UNIVERSITY_QUIZ_DATA } from "@/domain/geography/data/universities";
import { CITY_PLATE_PREFIX_COUNT } from "@/domain/geography/data/city-plates";
import { PROVINCES } from "@/domain/geography/data/provinces";
import {
  MAP_READING_TIPS,
  type KnowledgeCategoryId,
} from "@/features/knowledge/data/knowledge-data";

export const SEARCHABLE_CATEGORIES = new Set<KnowledgeCategoryId>([
  "city-plate",
  "universities",
  "confusable",
]);

export const PROFILE_BATCH_SIZE = 8;

export const CATEGORY_TOTAL_LABELS: Partial<
  Record<KnowledgeCategoryId, string>
> = {
  "province-profile": `${PROVINCES.length} 张名片`,
  "city-plate": `${CITY_PLATE_PREFIX_COUNT} 个前缀`,
  universities: `${UNIVERSITY_QUIZ_DATA.length} 所名校`,
  neighbors: `${PROVINCES.length} 省关系`,
  "city-counts": `${PROVINCES.length} 项数据`,
  rivers: "2 条大河",
  territory: "4 组集合",
  confusable: `${CONFUSABLE_CITY_PAIRS.length} 组辨析`,
  "map-reading": `${MAP_READING_TIPS.length} 个诀窍`,
};
