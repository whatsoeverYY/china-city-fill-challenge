"use client";

import { useState, type FormEvent } from "react";
import { usePlayerData } from "@/features/player/player-data-context";
import { adminPath } from "@/shared/lib/app-path";

export default function AccountControl() {
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
    clearProgress,
  } = usePlayerData();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
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

  const closeAccount = () => {
    setOpen(false);
    setDeleteConfirmOpen(false);
    setFormError("");
    setFormMessage("");
  };

  const confirmClearProgress = async () => {
    setBusy(true);
    setFormError("");
    setFormMessage("");
    try {
      await clearProgress();
      setDeleteConfirmOpen(false);
      setFormMessage("全部游戏记录已清除，账号本身仍然保留。");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "删档失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className={`account-fab account-fab--${syncStatus}`}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={identity ? `账户：${identity.email}` : "登录并保存游戏进度"}
      >
        <span aria-hidden="true">
          {identity ? identity.email.slice(0, 1).toUpperCase() : "存"}
        </span>
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
              onClick={closeAccount}
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
                    <a href={adminPath()} className="account-primary-link">
                      进入管理员后台
                    </a>
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
                  <button
                    type="button"
                    className="account-delete-progress"
                    onClick={() => {
                      setDeleteConfirmOpen(true);
                      setFormError("");
                      setFormMessage("");
                    }}
                    disabled={busy || offlineIdentity || syncStatus === "offline"}
                  >
                    一键清除全部游戏记录
                  </button>
                </div>
                {deleteConfirmOpen ? (
                  <section
                    className="account-delete-confirm"
                    role="alertdialog"
                    aria-labelledby="account-delete-confirm-title"
                    aria-describedby="account-delete-confirm-description"
                  >
                    <strong id="account-delete-confirm-title">确认清除全部游戏记录？</strong>
                    <p id="account-delete-confirm-description">
                      全国地图、邻省挑战、全部关卡、错题与答题历史都会从本机和云端清除。账号仍会保留，此操作不可恢复。
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmOpen(false)}
                        disabled={busy}
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        className="is-danger"
                        onClick={() => void confirmClearProgress()}
                        disabled={busy}
                      >
                        {busy ? "正在清除…" : "确认清除全部记录"}
                      </button>
                    </div>
                  </section>
                ) : null}
                {formMessage ? <p className="account-form-success">{formMessage}</p> : null}
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
                <p className="account-privacy-note">
                  仅保存邮箱、账号角色和游戏进度，不保存密码明文。
                </p>
              </>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
