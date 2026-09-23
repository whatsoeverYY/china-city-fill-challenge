import {
  WORLD_COUNTRY_BY_ID,
  type WorldCountryId,
} from "@/domain/geography/data/world-countries";
import {
  WORLD_EXPLORED_COUNTRIES_KEY,
  type ProgressStorage,
} from "@/infrastructure/storage/progress-storage";
import { parseWorldExplorationProgress } from "@/infrastructure/storage/world-exploration-progress";

export function recordWorldExploredCountry(
  progressStorage: ProgressStorage,
  countryId: WorldCountryId,
) {
  return progressStorage.updateItem(
    WORLD_EXPLORED_COUNTRIES_KEY,
    (previousValue) => JSON.stringify(Array.from(new Set([
      ...parseWorldExplorationProgress(previousValue).filter((id) =>
        WORLD_COUNTRY_BY_ID.has(id)
      ),
      countryId,
    ]))),
  );
}
