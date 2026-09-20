import {
  WORLD_COUNTRY_DATA_NOTICE,
  WORLD_BOUNDARY_DISCLAIMER,
  WORLD_MAP_DATA_NOTICE,
} from "@/domain/geography/data/world-data-policy";
import DataVintageNotice from "@/shared/components/data-vintage-notice";
import AppLink from "@/shared/components/app-link";
import PageBreadcrumbs from "@/shared/components/page-breadcrumbs";
import { routePath } from "@/shared/lib/app-path";

const worldCards = [
  {
    title: "世界地理知识",
    badge: "知",
    description: "从 195 个国家、首都与七大洲开始，建立世界地理框架。",
    href: "/world/knowledge",
    action: "进入知识馆",
  },
  {
    title: "世界地图关卡",
    badge: "关",
    description: "在世界地图填写国家名称，再用国界轮廓检验记忆。",
    href: "/world/gauntlet",
    action: "选择关卡",
  },
] as const;

export default function WorldHome() {
  return (
    <main className="mx-auto min-h-dvh w-[min(1240px,calc(100%_-_48px))] pb-16 pt-8 text-ink max-md:w-[min(680px,calc(100%_-_24px))] max-md:pt-4">
      <PageBreadcrumbs items={[{ label: "中国篇", href: routePath("/") }, { label: "世界篇" }]} />
      <section className="mt-8 overflow-hidden rounded-[30px_30px_30px_9px] border border-atlas-500/20 bg-card/85 px-8 py-12 shadow-xl max-sm:px-5 max-sm:py-8">
        <p className="m-0 text-meta font-black uppercase tracking-[0.24em] text-atlas-700">WORLD GEOGRAPHY · 第二期</p>
        <h1 className="mb-4 mt-3 max-w-[780px] font-serif text-display font-bold max-md:text-display-mobile">越过中国版图，打开世界地理</h1>
        <p className="m-0 max-w-[780px] text-body text-ink-soft">这里是完成中国篇后的进阶区域。先了解国家、首都与洲，再通过地图与轮廓关卡把知识真正记住。</p>
      </section>

      <div className="mt-6">
        <DataVintageNotice lines={[WORLD_MAP_DATA_NOTICE, WORLD_COUNTRY_DATA_NOTICE, WORLD_BOUNDARY_DISCLAIMER]} />
      </div>

      <section className="mt-8 grid grid-cols-2 gap-5 max-md:grid-cols-1" aria-label="世界篇功能入口">
        {worldCards.map((card, index) => (
          <article key={card.href} className={`rounded-[24px_24px_24px_7px] border p-6 shadow-lg ${index === 0 ? "border-scholar-500/20 bg-scholar-100/70" : "border-gold-600/25 bg-gold-100/75"}`}>
            <span className={`grid size-14 place-items-center rounded-[17px_17px_17px_5px] font-serif text-2xl font-black text-white ${index === 0 ? "bg-scholar-500" : "bg-gold-700"}`} aria-hidden="true">{card.badge}</span>
            <h2 className="mb-2 mt-5 font-serif text-section font-bold">{card.title}</h2>
            <p className="mb-6 mt-0 text-body text-ink-soft">{card.description}</p>
            <AppLink className={`inline-flex min-h-11 items-center rounded-full px-5 py-2.5 text-compact font-black text-white no-underline ${index === 0 ? "bg-scholar-600" : "bg-gold-800"}`} href={routePath(card.href)}>{card.action}</AppLink>
          </article>
        ))}
      </section>
    </main>
  );
}
