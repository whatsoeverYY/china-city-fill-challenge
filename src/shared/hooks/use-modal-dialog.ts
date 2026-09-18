"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "[data-autofocus]",
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");
const dialogStack: Array<{ dialog: HTMLElement; id: symbol }> = [];
let unlockedBodyOverflow: string | null = null;

function focusableElements(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => element.getClientRects().length > 0);
}

function focusDialog(dialog: HTMLElement) {
  const preferred = dialog.querySelector<HTMLElement>("[data-autofocus]");
  (preferred ?? focusableElements(dialog)[0] ?? dialog).focus();
}

export function useModalDialog(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null);
  const dialogIdRef = useRef(Symbol("modal-dialog"));
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const dialogId = dialogIdRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    if (dialogStack.length === 0) {
      unlockedBodyOverflow = document.body.style.overflow;
    }
    dialogStack.push({ dialog, id: dialogId });
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      if (dialogStack.at(-1)?.id !== dialogId) return;
      focusDialog(dialog);
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogStack.at(-1)?.id !== dialogId) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = focusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1)!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      const wasTopDialog = dialogStack.at(-1)?.id === dialogId;
      const stackIndex = dialogStack.findLastIndex(({ id }) => id === dialogId);
      if (stackIndex >= 0) dialogStack.splice(stackIndex, 1);
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      if (dialogStack.length === 0) {
        document.body.style.overflow = unlockedBodyOverflow ?? "";
        unlockedBodyOverflow = null;
      }
      if (wasTopDialog) {
        const nextDialog = dialogStack.at(-1)?.dialog;
        if (previousFocus?.isConnected && !nextDialog) previousFocus.focus();
        else if (previousFocus?.isConnected && nextDialog?.contains(previousFocus)) {
          previousFocus.focus();
        } else if (nextDialog) {
          focusDialog(nextDialog);
        }
      }
    };
  }, [open]);

  return dialogRef;
}
