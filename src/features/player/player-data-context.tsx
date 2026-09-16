"use client";

import { createContext, useContext } from "react";
import {
  createTrialProgressStorage,
} from "@/infrastructure/storage/progress-storage";
import type { PlayerDataContextValue } from "@/features/player/model/player-types";

const defaultContext: PlayerDataContextValue = {
  initialized: false,
  identity: null,
  profile: null,
  isAdmin: false,
  offlineIdentity: false,
  progressStorage: createTrialProgressStorage(new Map<string, string>()),
  progressEpoch: 0,
  syncStatus: "trial",
  syncMessage: "游客试玩不会保存进度",
  lastSyncedAt: null,
  signIn: async () => ({ message: "账号服务尚未初始化" }),
  signUp: async () => ({ message: "账号服务尚未初始化" }),
  signOut: async () => undefined,
  syncNow: async () => undefined,
  clearProgress: async () => undefined,
};

export const PlayerDataContext =
  createContext<PlayerDataContextValue>(defaultContext);

export function usePlayerData() {
  return useContext(PlayerDataContext);
}
