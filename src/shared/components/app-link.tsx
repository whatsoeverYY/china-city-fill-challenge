"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useRouter } from "next/navigation";
import { clientRoutePath } from "@/shared/lib/app-path";

type AppLinkProps = ComponentPropsWithoutRef<"a"> & { href: string };

export default function AppLink({
  children,
  download,
  href,
  onClick,
  target,
  ...props
}: AppLinkProps) {
  const router = useRouter();

  return (
    <a
      {...props}
      download={download}
      href={href}
      target={target}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.currentTarget.hasAttribute("download") ||
          (target && target !== "_self")
        ) return;

        event.preventDefault();
        router.push(clientRoutePath(href));
      }}
    >
      {children}
    </a>
  );
}
