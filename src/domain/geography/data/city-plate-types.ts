export type CityQuizItem = {
  id: string;
  city: string;
  provinceCode: string;
  province: string;
  provinceShort: string;
  plates: string[];
  plate: string;
  plateNote?: string;
  entityType: string;
  mapRegion: boolean;
  regionCode: string | null;
};
