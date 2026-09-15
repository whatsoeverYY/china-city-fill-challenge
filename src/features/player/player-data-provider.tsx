"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import AccountControl from "@/features/player/components/account-control";
import {
  PlayerDataContext,
  type PlayerDataContextValue,
  type PlayerIdentity,
  type PlayerProfile,
  type SyncStatus,
} from "@/features/player/player-data-context";
import {
  authErrorMessage,
  OFFLINE_ACCOUNT_KEY,
  readOfflineAccount,
} from "@/features/player/model/player-auth";
import { loadPlayerProfile } from "@/features/player/services/player-profile-service";
import { appPath } from "@/shared/lib/app-path";
import {
  assertSupportedProgressVersion,
  createResetProgressSnapshot,
  createTrialProgressStorage,
  createUserProgressStorage,
  mergeProgressSnapshots,
  normalizeProgressSnapshot,
  PROGRESS_STORAGE_EVENT,
  progressPayloadByteLength,
  readLocalProgressSnapshot,
  writeLocalProgressSnapshot,
  type ProgressSnapshot,
} from "@/infrastructure/storage/progress-storage";
import {
  CURRENT_PROGRESS_SCHEMA_VERSION,
  MAX_PROGRESS_PAYLOAD_BYTES,
} from "@/infrastructure/storage/progress-config";
import { operationErrorMessage } from "@/shared/lib/error";
import { getSupabaseClient, isSupabaseConfigured } from "@/infrastructure/supabase/client";

type ProgressRow = {
  user_id: string;
  schema_version: number;
  revision: number;
  payload: unknown;
  updated_at: string;
};

const SYNC_DELAY_MS = 1200;

export function PlayerDataProvider({ children }: { children: React.ReactNode }) {
  const supabaseConfigured = isSupabaseConfigured();
  const [trialProgressStorage] = useState(() =>
    createTrialProgressStorage(new Map<string, string>()),
  );
  const [initialized, setInitialized] = useState(!supabaseConfigured);
  const [identity, setIdentity] = useState<PlayerIdentity | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [offlineIdentity, setOfflineIdentity] = useState(false);
  const [progressEpoch, setProgressEpoch] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("trial");
  const [syncMessage, setSyncMessage] = useState(
    supabaseConfigured
      ? "游客试玩不会保存进度"
      : "本地开发未连接云存档，当前为游客试玩",
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const activeUserRef = useRef<string | null>(null);
  const readyUserRef = useRef<string | null>(null);
  const bootSequenceRef = useRef(0);
  const syncingRef = useRef(false);
  const syncWaitersRef = useRef(new Set<() => void>());

  const syncProgress = useCallback(async (userId: string) => {
    while (syncingRef.current) {
      await new Promise<void>((resolve) => {
        syncWaitersRef.current.add(resolve);
      });
    }
    if (!navigator.onLine) {
      setSyncStatus("offline");
      setSyncMessage("离线游玩中，联网后会自动同步");
      return;
    }
    syncingRef.current = true;
    setSyncStatus("syncing");
    setSyncMessage("正在同步云存档…");
    const supabase = getSupabaseClient();

    try {
      let local = readLocalProgressSnapshot(userId);
      let savedRow: ProgressRow | null = null;
      let uploadedSnapshot: ProgressSnapshot | null = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const { data: remoteRow, error: readError } = await supabase
          .from("user_progress")
          .select("user_id,schema_version,revision,payload,updated_at")
          .eq("user_id", userId)
          .maybeSingle<ProgressRow>();
        if (readError) throw readError;

        assertSupportedProgressVersion(
          remoteRow?.schema_version,
          remoteRow?.payload,
        );

        const merged = mergeProgressSnapshots(
          local,
          remoteRow ? normalizeProgressSnapshot(remoteRow.payload) : null,
        );
        if (progressPayloadByteLength(merged) > MAX_PROGRESS_PAYLOAD_BYTES) {
          throw new Error("游戏存档过大，请先清理部分错题后再同步");
        }

        if (remoteRow) {
          const { data, error } = await supabase
            .from("user_progress")
            .update({
              schema_version: CURRENT_PROGRESS_SCHEMA_VERSION,
              revision: remoteRow.revision + 1,
              payload: merged,
            })
            .eq("user_id", userId)
            .eq("revision", remoteRow.revision)
            .select("user_id,schema_version,revision,payload,updated_at")
            .maybeSingle<ProgressRow>();
          if (error) throw error;
          if (!data) {
            local = merged;
            continue;
          }
          savedRow = data;
        } else {
          const { data, error } = await supabase
            .from("user_progress")
            .insert({
              user_id: userId,
              schema_version: CURRENT_PROGRESS_SCHEMA_VERSION,
              revision: 1,
              payload: merged,
            })
            .select("user_id,schema_version,revision,payload,updated_at")
            .maybeSingle<ProgressRow>();
          if (error?.code === "23505") {
            local = merged;
            continue;
          }
          if (error) throw error;
          savedRow = data;
        }

        uploadedSnapshot = merged;
        break;
      }

      if (!savedRow || !uploadedSnapshot) {
        throw new Error("云存档发生并发更新，请稍后重试");
      }
      // 上传期间游戏仍可能继续产生新进度。再次合并当前本机状态，避免用
      // 刚上传的旧快照覆盖网络请求期间的新答案，并安排一次后续同步。
      const latestLocal = readLocalProgressSnapshot(userId);
      const finalLocal = mergeProgressSnapshots(latestLocal, uploadedSnapshot);
      writeLocalProgressSnapshot(userId, finalLocal);
      const needsFollowUpSync =
        JSON.stringify(finalLocal) !== JSON.stringify(uploadedSnapshot);
      const syncedAt = savedRow.updated_at ?? new Date().toISOString();
      setLastSyncedAt(syncedAt);
      if (needsFollowUpSync) {
        setSyncStatus("pending");
        setSyncMessage("新进度等待下一次同步");
        window.dispatchEvent(
          new CustomEvent(PROGRESS_STORAGE_EVENT, { detail: { userId } }),
        );
      } else {
        setSyncStatus("synced");
        setSyncMessage("云存档已同步");
      }
      void supabase.rpc("touch_player_profile");
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知同步错误";
      setSyncStatus("error");
      setSyncMessage(
        message.includes("user_progress") || message.includes("schema cache")
          ? "云存档尚未初始化，请管理员执行 Supabase 迁移"
          : `同步失败：${message}`,
      );
    } finally {
      syncingRef.current = false;
      const waiters = Array.from(syncWaitersRef.current);
      syncWaitersRef.current.clear();
      waiters.forEach((resolve) => resolve());
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    const userId = activeUserRef.current;
    if (!userId) return;
    await syncProgress(userId);
  }, [syncProgress]);

  const clearProgress = useCallback(async () => {
    const userId = activeUserRef.current;
    if (!userId) throw new Error("请先登录后再清除存档");
    if (offlineIdentity || !navigator.onLine) {
      throw new Error("清除全部存档需要联网，请恢复网络后重试");
    }
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    while (syncingRef.current) {
      await new Promise<void>((resolve) => {
        syncWaitersRef.current.add(resolve);
      });
    }

    syncingRef.current = true;
    setSyncStatus("syncing");
    setSyncMessage("正在清除本机与云端存档…");
    const supabase = getSupabaseClient();
    try {
      const { data, error } = await supabase.rpc("clear_player_progress", {
        target_user_id: userId,
      });
      if (error) throw error;
      const resetAt = typeof data === "string" ? data : new Date().toISOString();
      writeLocalProgressSnapshot(userId, createResetProgressSnapshot(resetAt));
      setProgressEpoch((value) => value + 1);
      setLastSyncedAt(resetAt);
      setSyncStatus("synced");
      setSyncMessage("全部游戏记录已清除");
      void supabase.rpc("touch_player_profile");
    } catch (error) {
      const message = operationErrorMessage(error, "未知删档错误");
      setSyncStatus("error");
      setSyncMessage(
        message.includes("clear_player_progress") || message.includes("schema cache")
          ? "删档功能尚未初始化，请管理员执行最新 Supabase 迁移"
          : `删档失败：${message}`,
      );
      throw new Error(
        message.includes("clear_player_progress") || message.includes("schema cache")
          ? "删档功能尚未初始化，请先执行最新 Supabase 迁移"
          : message,
      );
    } finally {
      syncingRef.current = false;
      const waiters = Array.from(syncWaitersRef.current);
      syncWaitersRef.current.clear();
      waiters.forEach((resolve) => resolve());
    }
  }, [offlineIdentity]);

  const markProgressDirty = useCallback(() => {
    if (!activeUserRef.current) return;
    setSyncStatus(navigator.onLine ? "pending" : "offline");
    setSyncMessage(
      navigator.onLine ? "新进度等待同步" : "离线进度已保存在本机",
    );
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(() => {
      syncTimerRef.current = null;
      void syncNow();
    }, SYNC_DELAY_MS);
  }, [syncNow]);

  const progressStorage = useMemo(
    () =>
      identity
        ? createUserProgressStorage(identity.id)
        : trialProgressStorage,
    [identity, trialProgressStorage],
  );

  useEffect(() => {
    const handleProgressChange = (event: Event) => {
      const userId = (event as CustomEvent<{ userId?: string }>).detail?.userId;
      if (userId === activeUserRef.current) markProgressDirty();
    };
    window.addEventListener(PROGRESS_STORAGE_EVENT, handleProgressChange);
    return () => window.removeEventListener(PROGRESS_STORAGE_EVENT, handleProgressChange);
  }, [markProgressDirty]);

  const loadProfile = useCallback(async (nextSession: Session) => {
    setProfile(await loadPlayerProfile(nextSession));
  }, []);

  const activateSession = useCallback(
    async (nextSession: Session | null) => {
      const sequence = ++bootSequenceRef.current;
      if (!nextSession) {
        if (!navigator.onLine) {
          const cached = readOfflineAccount();
          if (cached) {
            activeUserRef.current = cached.id;
            setIdentity({ id: cached.id, email: cached.email });
            setProfile((current) =>
              current ?? {
                id: cached.id,
                email: cached.email,
                role: cached.role,
                created_at: "",
                last_seen_at: "",
                updated_at: "",
              },
            );
            setOfflineIdentity(true);
            setSyncStatus("offline");
            setSyncMessage("离线存档已载入，联网后会恢复同步");
            if (readyUserRef.current !== cached.id) {
              readyUserRef.current = cached.id;
              setProgressEpoch((value) => value + 1);
            }
            setInitialized(true);
            return;
          }
        }
        activeUserRef.current = null;
        readyUserRef.current = null;
        setIdentity(null);
        setProfile(null);
        setOfflineIdentity(false);
        setSyncStatus("trial");
        setSyncMessage("游客试玩不会保存进度");
        setLastSyncedAt(null);
        setProgressEpoch((value) => value + 1);
        setInitialized(true);
        return;
      }

      setOfflineIdentity(false);
      const nextIdentity = {
        id: nextSession.user.id,
        email: nextSession.user.email ?? "",
      };
      activeUserRef.current = nextIdentity.id;
      setIdentity(nextIdentity);
      if (readyUserRef.current === nextIdentity.id) {
        setInitialized(true);
        return;
      }

      setSyncStatus("loading");
      setSyncMessage("正在载入你的存档…");
      await Promise.all([loadProfile(nextSession), syncProgress(nextIdentity.id)]);
      if (sequence !== bootSequenceRef.current) return;
      readyUserRef.current = nextIdentity.id;
      setProgressEpoch((value) => value + 1);
      setInitialized(true);
    },
    [loadProfile, syncProgress],
  );

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = getSupabaseClient();
    let disposed = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!disposed) void activateSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!disposed) window.setTimeout(() => void activateSession(nextSession), 0);
    });

    const handleOnline = () => {
      const userId = activeUserRef.current;
      if (!userId) return;
      setSyncStatus("pending");
      setSyncMessage("网络已恢复，准备同步…");
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          void activateSession(data.session).then(() => syncProgress(userId));
        } else {
          setSyncStatus("error");
          setSyncMessage("登录已过期，请重新登录后同步离线进度");
        }
      });
    };
    const handleOffline = () => {
      if (!activeUserRef.current) return;
      setSyncStatus("offline");
      setSyncMessage("离线游玩中，进度保存在本机");
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") void syncNow();
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      listener.subscription.unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (syncTimerRef.current !== null) window.clearTimeout(syncTimerRef.current);
    };
  }, [activateSession, supabaseConfigured, syncNow, syncProgress]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(authErrorMessage(error.message));
    return { message: "登录成功，正在载入云存档" };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const redirectTo = new URL(appPath("/"), window.location.origin).href;
    const { data, error } = await getSupabaseClient().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw new Error(authErrorMessage(error.message));
    if (!data.session) {
      return {
        message: "注册成功，请打开验证邮件后再登录",
        requiresEmailConfirmation: true,
      };
    }
    return { message: "注册成功，正在创建云存档" };
  }, []);

  const signOut = useCallback(async () => {
    await syncNow();
    localStorage.removeItem(OFFLINE_ACCOUNT_KEY);
    const { error } = await getSupabaseClient().auth.signOut({
      scope: navigator.onLine ? "global" : "local",
    });
    if (error) throw new Error(authErrorMessage(error.message));
    await activateSession(null);
  }, [activateSession, syncNow]);

  const value = useMemo<PlayerDataContextValue>(
    () => ({
      initialized,
      identity,
      profile,
      isAdmin: profile?.role === "admin",
      offlineIdentity,
      progressStorage,
      progressEpoch,
      syncStatus,
      syncMessage,
      lastSyncedAt,
      signIn,
      signUp,
      signOut,
      syncNow,
      clearProgress,
    }),
    [
      identity,
      initialized,
      lastSyncedAt,
      offlineIdentity,
      profile,
      progressEpoch,
      progressStorage,
      signIn,
      signOut,
      signUp,
      clearProgress,
      syncMessage,
      syncNow,
      syncStatus,
    ],
  );

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
      <AccountControl />
    </PlayerDataContext.Provider>
  );
}
