import { useEffect } from "react";
import {
  isUserProgressStorageKey,
  PROGRESS_STORAGE_EVENT,
} from "@/infrastructure/storage/progress-storage";

export function useProgressStorageListener(
  activeUserRef: { readonly current: string | null },
  onProgressChange: () => void,
) {
  useEffect(() => {
    const handleLocalChange = (event: Event) => {
      const userId = (event as CustomEvent<{ userId?: string }>).detail?.userId;
      if (userId === activeUserRef.current) onProgressChange();
    };
    const handleCrossTabChange = (event: StorageEvent) => {
      const userId = activeUserRef.current;
      if (userId && isUserProgressStorageKey(userId, event.key)) {
        onProgressChange();
      }
    };

    window.addEventListener(PROGRESS_STORAGE_EVENT, handleLocalChange);
    window.addEventListener("storage", handleCrossTabChange);
    return () => {
      window.removeEventListener(PROGRESS_STORAGE_EVENT, handleLocalChange);
      window.removeEventListener("storage", handleCrossTabChange);
    };
  }, [activeUserRef, onProgressChange]);
}
