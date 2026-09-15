"use client";

import { useGauntletAdvanceActions } from "./use-gauntlet-advance-actions";
import { useGauntletRoundActions } from "./use-gauntlet-round-actions";
import { useGauntletSelectionActions } from "./use-gauntlet-selection-actions";
import { useGauntletTextActions } from "./use-gauntlet-text-actions";

export function useGauntletActions() {
  const round = useGauntletRoundActions();
  const advance = useGauntletAdvanceActions(round);
  const selection = useGauntletSelectionActions(round, advance);
  const text = useGauntletTextActions(round, advance);
  return { ...round, ...advance, ...selection, ...text };
}

export type GauntletActions = ReturnType<typeof useGauntletActions>;
