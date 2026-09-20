"use client";

import { useEffect, useState } from "react";
import {
  hasSeenInitializationIndicator,
  rememberInitializationIndicator,
} from "@/features/player/model/player-auth";

const INITIALIZATION_INDICATOR_DELAY_MS = 400;

export default function PlayerInitializationGate({
  children,
  initialized,
}: {
  children: React.ReactNode;
  initialized: boolean;
}) {
  const [indicatorReady, setIndicatorReady] = useState(false);

  useEffect(() => {
    if (initialized) {
      rememberInitializationIndicator();
      return;
    }
    if (hasSeenInitializationIndicator()) return;
    const timer = window.setTimeout(
      () => {
        rememberInitializationIndicator();
        setIndicatorReady(true);
      },
      INITIALIZATION_INDICATOR_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [initialized]);

  const showIndicator = !initialized && indicatorReady;

  return (
    <>
      <div className="contents" aria-busy={!initialized} inert={!initialized}>
        {children}
      </div>
      {showIndicator ? (
        <div className="fixed inset-0 z-[1700] grid place-items-center bg-paper/90 p-6 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="rounded-[20px_20px_20px_6px] border border-jade-500/20 bg-card px-6 py-5 text-center shadow-xl">
            <span className="mx-auto mb-3 block size-7 animate-spin rounded-full border-[3px] border-jade-500/20 border-t-jade-500" aria-hidden="true" />
            <strong className="text-compact text-ink">正在确认账号与云存档…</strong>
          </div>
        </div>
      ) : null}
    </>
  );
}
