"use client";

import { useWorldAccess } from "@/features/player/model/use-world-access";
import AppLink from "@/shared/components/app-link";
import { routePath } from "@/shared/lib/app-path";

export default function WorldAccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = useWorldAccess();

  if (access === "unlocked") return children;

  if (access === "checking") {
    return (
      <main className="mx-auto grid min-h-dvh w-[min(760px,calc(100%_-_24px))] place-items-center py-12 text-center">
        <section className="w-full rounded-[28px_28px_28px_8px] border border-atlas-500/20 bg-card/90 px-6 py-16 shadow-xl" role="status" aria-live="polite">
          <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-[3px] border-atlas-500/20 border-t-atlas-500" aria-hidden="true" />
          <h1 className="m-0 font-serif text-section font-bold">正在核验世界篇资格…</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-dvh w-[min(820px,calc(100%_-_24px))] place-items-center py-12 text-center">
      <section className="w-full rounded-[28px_28px_28px_8px] border border-gold-600/25 bg-card/90 px-6 py-14 shadow-xl">
        <span className="mx-auto mb-5 grid size-20 place-items-center rounded-[22px_22px_22px_7px] bg-gold-200 font-serif text-3xl font-black text-gold-900" aria-hidden="true">锁</span>
        <p className="mb-3 text-meta font-black uppercase tracking-[0.2em] text-gold-800">WORLD CHAPTER</p>
        <h1 className="m-0 font-serif text-page font-bold max-sm:text-page-mobile">世界篇尚未解锁</h1>
        <p className="mx-auto mb-7 mt-4 max-w-[560px] text-body text-ink-soft">
          请先通关中国篇的 19 个主线关卡。错题复仇赛是练习关，不计入解锁条件。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <AppLink className="inline-flex min-h-11 items-center rounded-full bg-city-500 px-5 py-2.5 text-compact font-black text-white no-underline" href={routePath("/gauntlet")}>前往中国篇闯关</AppLink>
          <AppLink className="inline-flex min-h-11 items-center rounded-full border border-black/10 bg-paper-200 px-5 py-2.5 text-compact font-black text-ink no-underline" href={routePath("/")}>返回中国地图</AppLink>
        </div>
      </section>
    </main>
  );
}
