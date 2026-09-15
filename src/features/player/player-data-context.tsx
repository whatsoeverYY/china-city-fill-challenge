"use client";

import { createContext, useContext } from "react";
import {
  createTrialProgressStorage,
  type ProgressStorage,
} from "@/infrastructure/storage/progress-storage";

export type PlayerRole = "player" | "admin";

export type PlayerProfile = {
  id: string;
  email: string;
  role: PlayerRole;
  created_at: string;
  last_seen_at: string;
  updated_at: string;
};

export type PlayerIdentity = {
  id: string;
  email: string;
};

export type SyncStatus =
  | "trial"
  | "loading"
  | "pending"
  | "syncing"
  | "synced"
  | "offline"
  | "error";

export type AuthResult = {
  message: string;
  requiresEmailConfirmation?: boolean;
};

export type PlayerDataContextValue = {
  initialized: boolean;
  identity: PlayerIdentity | null;
  profile: PlayerProfile | null;
  isAdmin: boolean;
  offlineIdentity: boolean;
  progressStorage: ProgressStorage;
  progressEpoch: number;
  syncStatus: SyncStatus;
  syncMessage: string;
  lastSyncedAt: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  clearProgress: () => Promise<void>;
};

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
