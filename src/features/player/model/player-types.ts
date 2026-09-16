import type { ProgressStorage } from "@/infrastructure/storage/progress-storage";

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
