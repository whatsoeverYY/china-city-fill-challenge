import AppLink from "@/shared/components/app-link";

export type PageBreadcrumbItem = {
  label: string;
  mobileLabel?: string;
  href?: string;
};

export default function PageBreadcrumbs({
  items,
  className = "",
}: {
  items: PageBreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      className={`page-breadcrumbs min-w-0 ${className}`}
      aria-label="面包屑导航"
    >
      <ol className="m-0 flex min-h-11 min-w-0 list-none items-center gap-2 p-0 text-compact font-extrabold text-ink-500 max-sm:gap-1.5 max-sm:text-meta">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          const label = (
            <>
              <span className={item.mobileLabel ? "max-sm:hidden" : undefined}>
                {item.label}
              </span>
              {item.mobileLabel ? (
                <span className="hidden max-sm:inline">{item.mobileLabel}</span>
              ) : null}
            </>
          );

          return (
            <li
              className={`flex min-w-0 items-center gap-2 max-sm:gap-1.5 ${
                current ? "flex-1" : "shrink-0"
              }`}
              key={`${item.label}-${index}`}
            >
              {index > 0 ? (
                <span className="text-stone-400" aria-hidden="true">/</span>
              ) : null}
              {item.href && !current ? (
                <AppLink
                  className="rounded-sm text-ink-500 no-underline transition hover:text-city-600 hover:underline"
                  href={item.href}
                >
                  {label}
                </AppLink>
              ) : (
                <span
                  className="min-w-0 truncate text-ink"
                  aria-current={current ? "page" : undefined}
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
