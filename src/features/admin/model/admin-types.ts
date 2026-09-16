import type { PlayerProfile } from "@/features/player/model/player-types";

export type AdminProgressSummary = {
  user_id: string;
  schema_version: number;
  revision: number;
  updated_at: string;
  reset_at: string | null;
  completed_provinces: number;
  partial_provinces: number;
  placed_names: number;
  completed_neighbor_challenges: number;
  completed_level_ids: unknown;
  completed_levels: number;
  mistakes: number;
};

export type AdminProgressDetail = {
  user_id: string;
  schema_version: number;
  revision: number;
  payload: unknown;
  updated_at: string;
};

export type AdminPlayerRow = PlayerProfile & {
  progress: AdminProgressSummary | null;
};

export type DashboardStats = {
  total: number;
  withSave: number;
  activeSevenDays: number;
  passedLevels: number;
};

export const EMPTY_DASHBOARD_STATS: DashboardStats = {
  total: 0,
  withSave: 0,
  activeSevenDays: 0,
  passedLevels: 0,
};
