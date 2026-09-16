"use client";

import { useState, type FormEvent } from "react";
import { usePlayerData } from "@/features/player/player-data-context";
import { adminPath } from "@/shared/lib/app-path";

const ACCOUNT_ACTION_BUTTON_CLASS = "min-h-10 cursor-pointer rounded-xl border border-black/15 bg-white/70 text-[11px] font-extrabold disabled:cursor-wait disabled:opacity-60";
const ACCOUNT_TAB_CLASS = "min-h-10 cursor-pointer rounded-lg border-0 bg-transparent text-xs font-extrabold";
const ACCOUNT_INPUT_CLASS = "min-h-11 rounded-xl border border-black/20 bg-white px-3 py-2 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15";

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
        className="account-fab fixed bottom-5 right-5 z-[1400] grid min-h-12 cursor-pointer grid-cols-[30px_auto_8px] items-center gap-2 rounded-full border border-white/30 bg-ink/95 py-2 pl-2 pr-3 text-white shadow-xl backdrop-blur-xl max-sm:bottom-3 max-sm:right-3 max-sm:grid-cols-[30px_8px]"
        type="button"
        onClick={() => setOpen(true)}
        aria-label={identity ? `账户：${identity.email}` : "登录并保存游戏进度"}
      >
        <span className="grid size-[30px] place-items-center rounded-full bg-brand-green text-sm font-black" aria-hidden="true">
          {identity ? identity.email.slice(0, 1).toUpperCase() : "存"}
        </span>
        <b className="text-[11px] tracking-wide max-sm:hidden">{identity ? (offlineIdentity ? "离线存档" : "我的存档") : "登录保存"}</b>
        <i className={`block size-2 rounded-full ${syncStatus === "synced" ? "bg-[#67c693]" : syncStatus === "offline" ? "bg-[#81a5bb]" : syncStatus === "error" ? "bg-[#e07269]" : syncStatus === "pending" || syncStatus === "syncing" || syncStatus === "loading" ? "bg-brand-gold" : "bg-[#9aa39e]"}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="account-dialog-backdrop fixed inset-0 z-[1600] grid place-items-center bg-[#141c178f] p-5 backdrop-blur-md" role="presentation">
          <section
            className="account-dialog relative max-h-[calc(100dvh_-_44px)] w-full max-w-[460px] overflow-auto rounded-[24px_24px_24px_7px] border border-black/10 bg-card p-8 shadow-2xl max-sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-dialog-title"
          >
            <button
              className="dialog-close absolute right-4 top-4 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-black/5 text-xl"
              type="button"
              aria-label="关闭账户面板"
              onClick={closeAccount}
            >
              ×
            </button>

            {identity ? (
              <>
                <p className="eyebrow m-0 text-xs font-black tracking-[0.16em] text-brand-red">玩家存档</p>
                <h2 className="mb-3 mt-0 text-[clamp(24px,5vw,34px)] font-black leading-tight" id="account-dialog-title">欢迎回来</h2>
                <div className="account-identity-card flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-3.5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-green font-black text-white" aria-hidden="true">{identity.email.slice(0, 1).toUpperCase()}</span>
                  <div className="min-w-0">
                    <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[13px]">{identity.email}</strong>
                    <small className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-ink-soft">{isAdmin ? "管理员 · 同时拥有全部游戏能力" : "普通玩家"}</small>
                  </div>
                </div>
                <div className="sync-state mt-3.5 grid grid-cols-[10px_1fr] items-center gap-2.5 rounded-xl bg-paper px-3.5 py-3">
                  <i className={`block size-2 rounded-full ${syncStatus === "synced" ? "bg-[#67c693]" : syncStatus === "offline" ? "bg-[#81a5bb]" : syncStatus === "error" ? "bg-[#e07269]" : syncStatus === "pending" || syncStatus === "syncing" || syncStatus === "loading" ? "bg-brand-gold" : "bg-[#9aa39e]"}`} aria-hidden="true" />
                  <div>
                    <strong className="block text-[11px]">{syncMessage}</strong>
                    <small className="mt-1 block text-[9px] text-ink-soft">
                      {lastSyncedAt
                        ? `最近同步：${new Date(lastSyncedAt).toLocaleString("zh-CN")}`
                        : "登录后，本机进度会与云端合并"}
                    </small>
                  </div>
                </div>
                <div className="account-actions mt-4 grid grid-cols-2 gap-2">
                  {isAdmin ? (
                    <a href={adminPath()} className="account-primary-link col-span-2 grid min-h-11 place-items-center rounded-xl bg-brand-green px-4 text-xs font-black text-white no-underline">
                      进入管理员后台
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className={ACCOUNT_ACTION_BUTTON_CLASS}
                    onClick={() => void syncNow()}
                    disabled={syncStatus === "syncing" || offlineIdentity}
                  >
                    立即同步
                  </button>
                  <button
                    type="button"
                    className={`${ACCOUNT_ACTION_BUTTON_CLASS} account-signout text-brand-red-dark`}
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
                    className={`${ACCOUNT_ACTION_BUTTON_CLASS} account-delete-progress col-span-2 !border-brand-red/25 !bg-brand-red/5 text-brand-red-dark`}
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
                    className="account-delete-confirm mt-3.5 rounded-xl border border-brand-red/20 bg-brand-red/5 p-3.5 text-brand-red-dark"
                    role="alertdialog"
                    aria-labelledby="account-delete-confirm-title"
                    aria-describedby="account-delete-confirm-description"
                  >
                    <strong className="block text-xs" id="account-delete-confirm-title">确认清除全部游戏记录？</strong>
                    <p className="my-2 text-[10px] leading-4" id="account-delete-confirm-description">
                      全国地图、邻省挑战、全部关卡、错题与答题历史都会从本机和云端清除。账号仍会保留，此操作不可恢复。
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className="min-h-10 cursor-pointer rounded-lg border border-black/15 bg-white px-2.5 text-[10px] font-black disabled:cursor-wait disabled:opacity-60"
                        type="button"
                        onClick={() => setDeleteConfirmOpen(false)}
                        disabled={busy}
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        className="min-h-10 cursor-pointer rounded-lg border border-brand-red-dark bg-brand-red-dark px-2.5 text-[10px] font-black text-white disabled:cursor-wait disabled:opacity-60"
                        onClick={() => void confirmClearProgress()}
                        disabled={busy}
                      >
                        {busy ? "正在清除…" : "确认清除全部记录"}
                      </button>
                    </div>
                  </section>
                ) : null}
                {formMessage ? <p className="account-form-success mt-3 rounded-xl bg-brand-green/10 px-3 py-2.5 text-xs leading-5 text-brand-green-dark">{formMessage}</p> : null}
                {formError ? <p className="account-form-error mt-3 rounded-xl bg-brand-red/10 px-3 py-2.5 text-xs leading-5 text-brand-red-dark">{formError}</p> : null}
              </>
            ) : (
              <>
                <p className="eyebrow m-0 text-xs font-black tracking-[0.16em] text-brand-red">云存档</p>
                <h2 className="mb-3 mt-0 text-[clamp(24px,5vw,34px)] font-black leading-tight" id="account-dialog-title">登录后，进度真正属于你</h2>
                <p className="account-dialog-lede text-[13px] leading-6 text-ink-soft">
                  游客可以完整试玩，但刷新页面后不会保留进度。登录后支持跨设备同步；曾在线登录过的设备，断网时也能继续玩。
                </p>
                <div className="account-tabs my-5 grid grid-cols-2 rounded-xl bg-paper-deep p-1" role="tablist" aria-label="账户操作">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signin"}
                    className={`${ACCOUNT_TAB_CLASS} ${mode === "signin" ? "bg-card text-brand-green-dark shadow-sm" : ""}`}
                    onClick={() => switchMode("signin")}
                  >
                    登录
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signup"}
                    className={`${ACCOUNT_TAB_CLASS} ${mode === "signup" ? "bg-card text-brand-green-dark shadow-sm" : ""}`}
                    onClick={() => switchMode("signup")}
                  >
                    注册
                  </button>
                </div>
                <form className="account-form grid gap-2" onSubmit={submit}>
                  <label className="mt-1.5 text-[11px] font-extrabold text-ink-soft" htmlFor="account-email">邮箱</label>
                  <input
                    className={ACCOUNT_INPUT_CLASS}
                    id="account-email"
                    type="email"
                    value={email}
                    autoComplete="email"
                    placeholder="name@example.com"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                  <label className="mt-1.5 text-[11px] font-extrabold text-ink-soft" htmlFor="account-password">密码</label>
                  <input
                    className={ACCOUNT_INPUT_CLASS}
                    id="account-password"
                    type="password"
                    value={password}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    minLength={8}
                    placeholder="至少 8 位"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button className="mt-2.5 grid min-h-12 cursor-pointer place-items-center rounded-xl border-0 bg-brand-green px-4 py-2.5 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60" type="submit" disabled={busy || !initialized}>
                    {busy ? "请稍候…" : mode === "signin" ? "登录并载入存档" : "注册云存档账号"}
                  </button>
                </form>
                {formMessage ? <p className="account-form-success mt-3 rounded-xl bg-brand-green/10 px-3 py-2.5 text-xs leading-5 text-brand-green-dark">{formMessage}</p> : null}
                {formError ? <p className="account-form-error mt-3 rounded-xl bg-brand-red/10 px-3 py-2.5 text-xs leading-5 text-brand-red-dark">{formError}</p> : null}
                <p className="account-privacy-note mt-4 text-center text-[10px] text-ink-soft">
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
