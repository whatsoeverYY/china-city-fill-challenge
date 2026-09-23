import {
  WORLD_COUNTRIES,
  type WorldCountryId,
} from "@/domain/geography/data/world-countries";
import {
  DEFAULT_WORLD_MAP_ROUTE_ID,
  WORLD_MAP_ROUTE_SEEDS,
  type WorldMapRouteSeed,
} from "./world-map-route-seeds";

export type WorldMapRoute = WorldMapRouteSeed & {
  countryIds: readonly WorldCountryId[];
};

export const WORLD_MAP_ROUTES: readonly WorldMapRoute[] =
  WORLD_MAP_ROUTE_SEEDS.map((route) => ({
    ...route,
    countryIds: WORLD_COUNTRIES
      .filter((country) => route.subregions.includes(country.subregion))
      .map((country) => country.id),
  }));

export { DEFAULT_WORLD_MAP_ROUTE_ID };
