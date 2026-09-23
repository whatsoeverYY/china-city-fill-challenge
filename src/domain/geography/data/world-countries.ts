import catalogData from "./world-countries.json";

export type WorldCapital = {
  name: string;
  englishName: string;
  role: string;
};

export type WorldCountry = {
  id: `country:${string}`;
  m49Code: string;
  isoAlpha3: string;
  mapCode: string;
  name: string;
  englishName: string;
  aliases: string[];
  continentId: WorldContinentId;
  continentName: string;
  subregion: string;
  capitals: WorldCapital[];
  label: [number, number];
  shapeEligible: boolean;
};

export type WorldCountryId = WorldCountry["id"];

export type WorldContinentId =
  | "africa"
  | "asia"
  | "europe"
  | "north-america"
  | "south-america"
  | "oceania";

export type WorldCountryCatalog = {
  schemaVersion: number;
  countryDataAsOf: string;
  capitalDataAsOf: string;
  countryCount: number;
  definition: string;
  sourceVersions: {
    countryRegister: string;
    countryBoundaries: string;
    capitalPlaces: string;
    capitalAudit: string;
  };
  audit: {
    checkedAt: string;
    m49CountryCodesMatched: number;
    currentCountryNamesMatched: number;
    currentLocalizedCountryNamesMatched: number;
    capitalRecordsMatched: number;
  };
  sources: string[];
  countries: WorldCountry[];
};

export const WORLD_COUNTRY_CATALOG = catalogData as WorldCountryCatalog;
export const WORLD_COUNTRIES = WORLD_COUNTRY_CATALOG.countries;
export const WORLD_COUNTRY_BY_ID: ReadonlyMap<string, WorldCountry> = new Map(
  WORLD_COUNTRIES.map((country) => [country.id, country]),
);
