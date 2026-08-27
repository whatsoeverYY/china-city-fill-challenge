"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { adminPath, appPath } from "./app-path";
import {
  claimLegacyProgress,
  createTrialProgressStorage,
  createUserProgressStorage,
  mergeProgressSnapshots,
  normalizeProgressSnapshot,
  PROGRESS_STORAGE_EVENT,
  readLocalProgressSnapshot,
  writeLocalProgressSnapshot,
  type ProgressStorage,
  type ProgressSnapshot,
} from "./progress-storage";
import { getSupabaseClient } from "./supabase-client";

export type PlayerRole = "player" | "admin";

export type PlayerProfile = {
  id: string;
  email: string;
  role: PlayerRole;
  created_at: string;
  last_seen_at: string;
  updated_at: string;
};

type PlayerIdentity = {
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

type AuthResult = {
  message: string;
  requiresEmailConfirmation?: boolean;
};

type PlayerDataContextValue = {
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
};

type OfflineAccount = PlayerIdentity & { role: PlayerRole };
type ProgressRow = {
  user_id: string;
  schema_version: number;
  revision: number;
  payload: unknown;
  updated_at: string;
};

const OFFLINE_ACCOUNT_KEY = "china-city-fill-offline-account-v1";
const SYNC_DELAY_MS = 1200;

const defaultTrialMemory = new Map<string, string>();
const defaultContext: PlayerDataContextValue = {
  initialized: false,
  identity: null,
  profile: null,
  isAdmin: false,
  offlineIdentity: false,
  progressStorage: createTrialProgressStorage(defaultTrialMemory),
  progressEpoch: 0,
  syncStatus: "trial",
  syncMessage: "游客试玩不会保存进度",
  lastSyncedAt: null,
  signIn: async () => ({ message: "账号服务尚未初始化" }),
  signUp: async () => ({ message: "账号服务尚未初始化" }),
  signOut: async () => undefined,
  syncNow: async () => undefined,
};

const PlayerDataContext = createContext<PlayerDataContextValue>(defaultContext);

function readOfflineAccount() {
  try {
    const parsed = JSON.parse(localStorage.getItem(OFFLINE_ACCOUNT_KEY) ?? "null") as
      | Partial<OfflineAccount>
      | null;
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.email === "string" &&
      (parsed.role === "player" || parsed.role === "admin")
    ) {
      return parsed as OfflineAccount;
    }
  } catch {
    // 损坏的离线身份只影响本机回退，不影响 Supabase 登录。
  }
  return null;
}

function saveOfflineAccount(account: OfflineAccount) {
  localStorage.setItem(OFFLINE_ACCOUNT_KEY, JSON.stringify(account));
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "邮箱或密码不正确";
  if (normalized.includes("email not confirmed")) return "请先在邮箱中完成验证";
  if (normalized.includes("already registered")) return "这个邮箱已经注册过了";
  if (normalized.includes("password")) return "密码至少需要 8 位";
  if (normalized.includes("fetch") || normalized.includes("network")) {
    return "当前网络不可用，请联网后重试";
  }
  return message;
}

export function PlayerDataProvider({ children }: { children: React.ReactNode }) {
  const [trialProgressStorage] = useState(() =>
    createTrialProgressStorage(new Map<string, string>()),
  );
  const [initialized, setInitialized] = useState(false);
  const [identity, setIdentity] = useState<PlayerIdentity | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [offlineIdentity, setOfflineIdentity] = useState(false);
  const [progressEpoch, setProgressEpoch] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("trial");
  const [syncMessage, setSyncMessage] = useState("游客试玩不会保存进度");
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

        const merged = mergeProgressSnapshots(
          local,
          remoteRow ? normalizeProgressSnapshot(remoteRow.payload) : null,
        );

        if (remoteRow) {
          const { data, error } = await supabase
            .from("user_progress")
            .update({
              schema_version: 1,
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
              schema_version: 1,
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
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("player_profiles")
      .select("id,email,role,created_at,last_seen_at,updated_at")
      .eq("id", nextSession.user.id)
      .maybeSingle<PlayerProfile>();
    if (error || !data) {
      const fallback: PlayerProfile = {
        id: nextSession.user.id,
        email: nextSession.user.email ?? "",
        role: "player",
        created_at: nextSession.user.created_at,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(fallback);
      saveOfflineAccount({ id: fallback.id, email: fallback.email, role: fallback.role });
      return;
    }
    setProfile(data);
    saveOfflineAccount({ id: data.id, email: data.email, role: data.role });
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
      claimLegacyProgress(nextIdentity.id);
      await Promise.all([loadProfile(nextSession), syncProgress(nextIdentity.id)]);
      if (sequence !== bootSequenceRef.current) return;
      readyUserRef.current = nextIdentity.id;
      setProgressEpoch((value) => value + 1);
      setInitialized(true);
    },
    [loadProfile, syncProgress],
  );

  useEffect(() => {
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
  }, [activateSession, syncNow, syncProgress]);

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

export function usePlayerData() {
  return useContext(PlayerDataContext);
}

function AccountControl() {
  const {
    initialized,
    identity,
    isAdmin,
    offlineIdentity,
    syncStatus,
    syncMessage,
    lastSyncedAt,
    signIn,
    signUp,
    signOut,
    syncNow,
  } = usePlayerData();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    setFormMessage("");
    try {
      const result = mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password);
      setFormMessage(result.message);
      if (!result.requiresEmailConfirmation) setPassword("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "操作失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (nextMode: "signin" | "signup") => {
    setMode(nextMode);
    setFormError("");
    setFormMessage("");
  };

  return (
    <>
      <button
        className={`account-fab account-fab--${syncStatus}`}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={identity ? `账户：${identity.email}` : "登录并保存游戏进度"}
      >
        <span aria-hidden="true">{identity ? identity.email.slice(0, 1).toUpperCase() : "存"}</span>
        <b>{identity ? (offlineIdentity ? "离线存档" : "我的存档") : "登录保存"}</b>
        <i aria-hidden="true" />
      </button>

      {open ? (
        <div className="account-dialog-backdrop" role="presentation">
          <section
            className="account-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-dialog-title"
          >
            <button
              className="dialog-close"
              type="button"
              aria-label="关闭账户面板"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            {identity ? (
              <>
                <p className="eyebrow">玩家存档</p>
                <h2 id="account-dialog-title">欢迎回来</h2>
                <div className="account-identity-card">
                  <span aria-hidden="true">{identity.email.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <strong>{identity.email}</strong>
                    <small>{isAdmin ? "管理员 · 同时拥有全部游戏能力" : "普通玩家"}</small>
                  </div>
                </div>
                <div className={`sync-state sync-state--${syncStatus}`}>
                  <i aria-hidden="true" />
                  <div>
                    <strong>{syncMessage}</strong>
                    <small>
                      {lastSyncedAt
                        ? `最近同步：${new Date(lastSyncedAt).toLocaleString("zh-CN")}`
                        : "登录后，本机进度会与云端合并"}
                    </small>
                  </div>
                </div>
                <div className="account-actions">
                  {isAdmin ? (
                    <Link href={adminPath()} className="account-primary-link">
                      进入管理员后台
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void syncNow()}
                    disabled={syncStatus === "syncing" || offlineIdentity}
                  >
                    立即同步
                  </button>
                  <button
                    type="button"
                    className="account-signout"
                    onClick={() => {
                      setBusy(true);
                      void signOut()
                        .then(() => setOpen(false))
                        .catch((error: unknown) =>
                          setFormError(error instanceof Error ? error.message : "退出失败"),
                        )
                        .finally(() => setBusy(false));
                    }}
                    disabled={busy}
                  >
                    退出登录
                  </button>
                </div>
                {formError ? <p className="account-form-error">{formError}</p> : null}
              </>
            ) : (
              <>
                <p className="eyebrow">云存档</p>
                <h2 id="account-dialog-title">登录后，进度真正属于你</h2>
                <p className="account-dialog-lede">
                  游客可以完整试玩，但刷新页面后不会保留进度。登录后支持跨设备同步；曾在线登录过的设备，断网时也能继续玩。
                </p>
                <div className="account-tabs" role="tablist" aria-label="账户操作">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signin"}
                    className={mode === "signin" ? "is-active" : ""}
                    onClick={() => switchMode("signin")}
                  >
                    登录
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signup"}
                    className={mode === "signup" ? "is-active" : ""}
                    onClick={() => switchMode("signup")}
                  >
                    注册
                  </button>
                </div>
                <form className="account-form" onSubmit={submit}>
                  <label htmlFor="account-email">邮箱</label>
                  <input
                    id="account-email"
                    type="email"
                    value={email}
                    autoComplete="email"
                    placeholder="name@example.com"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                  <label htmlFor="account-password">密码</label>
                  <input
                    id="account-password"
                    type="password"
                    value={password}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    minLength={8}
                    placeholder="至少 8 位"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button type="submit" disabled={busy || !initialized}>
                    {busy ? "请稍候…" : mode === "signin" ? "登录并载入存档" : "注册云存档账号"}
                  </button>
                </form>
                {formMessage ? <p className="account-form-success">{formMessage}</p> : null}
                {formError ? <p className="account-form-error">{formError}</p> : null}
                <p className="account-privacy-note">仅保存邮箱、账号角色和游戏进度，不保存密码明文。</p>
              </>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
