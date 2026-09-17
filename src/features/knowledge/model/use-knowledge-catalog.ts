import { useMemo, useState } from "react";
import { CITY_QUIZ_DATA, PLATE_QUIZ_DATA } from "@/domain/geography/data/city-plates";
import { getProvinceAdministrativeProfile } from "@/domain/geography/data/province-administrative-profiles";
import { PROVINCE_CITY_COUNT_DATA } from "@/domain/geography/data/province-city-counts";
import { UNIVERSITY_QUIZ_DATA } from "@/domain/geography/data/universities";
import { PROFILE_BATCH_SIZE } from "@/features/knowledge/config/knowledge-catalog-config";
import { KNOWLEDGE_CATEGORIES } from "@/features/knowledge/data/knowledge-data";
import { compactSearch, matchesSearch } from "@/features/knowledge/model/knowledge-format";
import type { KnowledgeBaseProps } from "@/features/knowledge/model/knowledge-types";

export const DEFAULT_NEIGHBOR_PROVINCE_CODE = "410000";

export function useKnowledgeCatalog({
  categoryId,
  provinces,
  provinceNeighbors,
}: Pick<KnowledgeBaseProps, "categoryId" | "provinces" | "provinceNeighbors">) {
  const [query, setQuery] = useState("");
  const [selectedProvinceCodes, setSelectedProvinceCodes] = useState<Set<string>>(
    () => new Set(),
  );
  const [visibleProfileCount, setVisibleProfileCount] = useState(PROFILE_BATCH_SIZE);
  const [selectedNeighborCode, setSelectedNeighborCode] = useState(
    DEFAULT_NEIGHBOR_PROVINCE_CODE,
  );
  const provinceByCode = useMemo(
    () => new Map(provinces.map((province) => [province.code, province])),
    [provinces],
  );
  const cityCountByCode = useMemo(
    () => new Map(PROVINCE_CITY_COUNT_DATA.map((item) => [item.code, item])),
    [],
  );
  const administrativeProfileByCode = useMemo(
    () => new Map(PROVINCE_CITY_COUNT_DATA.map((item) => [
      item.code,
      getProvinceAdministrativeProfile(item.code, item.cityCount),
    ])),
    [],
  );
  const quizCityCountByProvince = useMemo(() => {
    const result = new Map<string, number>();
    CITY_QUIZ_DATA.forEach((item) => {
      result.set(item.provinceCode, (result.get(item.provinceCode) ?? 0) + 1);
    });
    return result;
  }, []);
  const universityCountByProvince = useMemo(() => {
    const result = new Map<string, number>();
    UNIVERSITY_QUIZ_DATA.forEach((item) => {
      result.set(item.provinceCode, (result.get(item.provinceCode) ?? 0) + 1);
    });
    return result;
  }, []);
  const activeCategory = KNOWLEDGE_CATEGORIES.find(
    (category) => category.id === categoryId,
  );
  const normalizedQuery = compactSearch(query);

  const clearProvinceFilters = () => {
    setQuery("");
    setSelectedProvinceCodes(new Set());
    setVisibleProfileCount(PROFILE_BATCH_SIZE);
  };
  const filteredProvinces = provinces.filter(
    (province) => matchesSearch(normalizedQuery, province.name, province.shortName) &&
      (selectedProvinceCodes.size === 0 || selectedProvinceCodes.has(province.code)),
  );
  const hasActiveProvinceFilter = Boolean(normalizedQuery || selectedProvinceCodes.size > 0);
  const visibleProfileProvinces = hasActiveProvinceFilter
    ? filteredProvinces
    : filteredProvinces.slice(0, visibleProfileCount);
  const toggleProvince = (provinceCode: string) => {
    setVisibleProfileCount(PROFILE_BATCH_SIZE);
    setSelectedProvinceCodes((current) => {
      const next = new Set(current);
      if (next.has(provinceCode)) next.delete(provinceCode);
      else next.add(provinceCode);
      return next;
    });
  };
  const filteredCities = PLATE_QUIZ_DATA.filter((item) => matchesSearch(
    normalizedQuery, item.city, item.plate, item.plateNote,
    item.province, item.provinceShort,
  ));
  const cityGroups = provinces.map((province) => ({
    province,
    items: filteredCities.filter((item) => item.provinceCode === province.code),
  })).filter((group) => group.items.length > 0);
  const filteredUniversities = UNIVERSITY_QUIZ_DATA.filter((item) => matchesSearch(
    normalizedQuery, item.name, item.tier, item.city, item.province, item.provinceShort,
  ));
  const universityGroups = provinces.map((province) => ({
    province,
    items: filteredUniversities.filter((item) => item.provinceCode === province.code),
  })).filter((group) => group.items.length > 0);
  const selectedNeighborProvince = provinceByCode.get(selectedNeighborCode) ?? provinces[0];
  const selectedNeighborCodes = selectedNeighborProvince
    ? provinceNeighbors[selectedNeighborProvince.code] ?? []
    : [];

  return {
    activeCategory, activeCategoryId: categoryId, administrativeProfileByCode,
    cityCountByCode, cityGroups, clearProvinceFilters, filteredProvinces,
    hasActiveProvinceFilter, normalizedQuery, provinceByCode,
    query, quizCityCountByProvince, selectedNeighborCodes, selectedNeighborProvince,
    selectedProvinceCodes, setQuery, setSelectedNeighborCode, setVisibleProfileCount,
    toggleProvince, universityCountByProvince, universityGroups, visibleProfileProvinces,
  };
}
