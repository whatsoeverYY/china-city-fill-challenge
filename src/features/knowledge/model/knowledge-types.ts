export type KnowledgeProvince = {
  code: string;
  name: string;
  shortName: string;
  kind: "省" | "自治区" | "直辖市" | "特别行政区";
};

export type KnowledgeBaseProps = {
  categoryId: import("@/features/knowledge/data/knowledge-data").KnowledgeCategoryId | null;
  provinces: KnowledgeProvince[];
  provinceCapitals: Record<string, string>;
  provinceNeighbors: Record<string, string[]>;
  provincePlatePrefixes: Record<string, string>;
  provinceGroups: ProvinceGroup[];
};
import type { ProvinceGroup } from "@/domain/geography/data/geographic-groups";
