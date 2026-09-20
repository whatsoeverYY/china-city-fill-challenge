"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/infrastructure/supabase/client";

const AUTH_EVENT_DEFER_MS = 0;
const AUTH_BOOT_TIMEOUT_MS = 1_500;

export function usePlayerSessionListener(
  enabled: boolean,
  activateSession: (session: Session | null) => Promise<void>,
  setInitialized: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    const bootTimer = window.setTimeout(() => {
      if (!disposed) setInitialized(true);
    }, AUTH_BOOT_TIMEOUT_MS);
    const { data: listener } = getSupabaseClient().auth.onAuthStateChange(
      (_event, nextSession) => {
        if (disposed) return;
        window.clearTimeout(bootTimer);
        window.setTimeout(() => {
          if (!disposed) void activateSession(nextSession);
        }, AUTH_EVENT_DEFER_MS);
      },
    );

    return () => {
      disposed = true;
      window.clearTimeout(bootTimer);
      listener.subscription.unsubscribe();
    };
  }, [activateSession, enabled, setInitialized]);
}
