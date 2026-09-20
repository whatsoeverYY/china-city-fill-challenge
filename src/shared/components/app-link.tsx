"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useRouter } from "next/navigation";

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
          process.env.NEXT_PUBLIC_BASE_PATH ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.currentTarget.hasAttribute("download") ||
          (target && target !== "_self")
        ) return;

        event.preventDefault();
        router.push(href);
      }}
    >
      {children}
    </a>
  );
}
