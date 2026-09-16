import { CONFUSABLE_CITY_PAIRS } from "@/domain/geography/data/confusable-cities";
import { UNIVERSITY_QUIZ_DATA } from "@/domain/geography/data/universities";
import { CITY_PLATE_PREFIX_COUNT } from "@/domain/geography/data/city-plates";
import { PROVINCES } from "@/domain/geography/data/provinces";
import {
  GAUNTLET_LEVEL_COUNT,
  gauntletLevelNumber,
} from "@/domain/game/gauntlet-levels";
import {
  CATEGORY_TOTAL_LABELS,
} from "@/features/knowledge/config/knowledge-catalog-config";
import {
  KNOWLEDGE_CATEGORIES,
  type KnowledgeCategoryId,
} from "@/features/knowledge/data/knowledge-data";

export default function KnowledgeCatalog({
  onOpenCategory,
}: {
  onOpenCategory: (categoryId: KnowledgeCategoryId) => void;
}) {
  return (
    <>
      <section className="knowledge-home-hero mx-auto grid w-[min(1380px,calc(100%_-_48px))] grid-cols-[minmax(0,1.55fr)_minmax(280px,.45fr)] items-end gap-[clamp(42px,8vw,120px)] py-[clamp(58px,8vw,105px)] max-lg:grid-cols-1 max-sm:w-[calc(100%_-_24px)] max-sm:py-10">
        <div>
          <p className="eyebrow m-0 text-xs font-black tracking-[0.16em] text-[#735285]">把答案串成真正记得住的知识</p>
          <h2 className="my-5 max-w-4xl text-[clamp(42px,6.2vw,82px)] font-black leading-none tracking-[-0.04em]">先理解，再挑战。<br /><span className="text-[#735285]">让每个答案都有位置。</span></h2>
          <p className="m-0 max-w-3xl text-sm leading-7 text-ink-soft">
            覆盖全部关卡会用到的省份、城市、车牌、名校、邻省和疆域知识，并加入长江黄河、易混城市与读图方法。
          </p>
        </div>
        <div className="knowledge-coverage-card rounded-[22px_22px_22px_7px] border border-[#735285]/20 bg-[#faf6fbe6] p-7 shadow-lg">
          <span className="text-[10px] font-black tracking-widest text-[#7a6b7f]">关卡知识覆盖</span>
          <strong className="my-2 block text-6xl text-[#735285]">
            {GAUNTLET_LEVEL_COUNT}<small className="text-xl">/{GAUNTLET_LEVEL_COUNT}</small>
          </strong>
          <div className="h-2 overflow-hidden rounded-full bg-[#735285]/10"><i className="block h-full w-full bg-[#735285]" /></div>
          <p className="mb-0 text-xs leading-5 text-ink-soft">错题复仇赛与终极混战，会复用前面专题中的知识。</p>
        </div>
      </section>

      <section className="knowledge-stat-strip mx-auto mb-16 grid w-[min(1380px,calc(100%_-_48px))] grid-cols-4 overflow-hidden rounded-2xl border border-black/10 bg-card/80 max-sm:w-[calc(100%_-_24px)] max-sm:grid-cols-2" aria-label="知识库收录概况">
        {[
          [String(PROVINCES.length), "省级行政区"],
          [String(CITY_PLATE_PREFIX_COUNT), "车牌前缀"],
          [String(UNIVERSITY_QUIZ_DATA.length), "985 · 211 高校"],
          [String(CONFUSABLE_CITY_PAIRS.length), "易混城市组"],
        ].map(([value, label], index) => (
          <div className={`p-4 text-center ${index > 0 ? "border-l border-black/10" : ""}`} key={label}>
            <strong className="block text-2xl text-[#735285]">{value}</strong>
            <span className="text-[10px] font-bold text-ink-soft">{label}</span>
          </div>
        ))}
      </section>

      <section className="knowledge-catalog mx-auto w-[min(1380px,calc(100%_-_48px))] pb-20 max-sm:w-[calc(100%_-_24px)]" aria-labelledby="knowledge-catalog-title">
        <div className="knowledge-section-heading mb-6 flex items-end justify-between gap-6 max-md:block">
          <div>
            <p className="eyebrow m-0 text-xs font-black tracking-[0.16em] text-[#735285]">选择一个专题</p>
            <h2 className="mb-0 mt-2 text-3xl font-black" id="knowledge-catalog-title">九种记忆方式，建立一张知识网</h2>
          </div>
          <p className="max-w-md text-xs leading-5 text-ink-soft">每张卡片都标明关联关卡，学完可以直接回游戏验证。</p>
        </div>
        <div className="knowledge-category-grid grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {KNOWLEDGE_CATEGORIES.map((category, index) => (
            <button
              className="knowledge-category-card relative grid min-h-64 cursor-pointer grid-rows-[auto_1fr_auto] gap-3 rounded-[20px_20px_20px_6px] border border-black/10 bg-card/90 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              key={category.id}
              type="button"
              onClick={() => onOpenCategory(category.id)}
            >
              <span className="knowledge-category-number absolute right-5 top-5 text-xs font-black text-black/30">
                {String(index + 1).padStart(2, "0")}
              </span>
              <b className="text-4xl" aria-hidden="true">{category.icon}</b>
              <div>
                <p className="text-[10px] font-black text-[#735285]">{category.memoryStyle} · {CATEGORY_TOTAL_LABELS[category.id]}</p>
                <h3 className="mb-2 mt-3 text-2xl font-black">{category.title}</h3>
                <span className="text-xs leading-5 text-ink-soft">{category.subtitle}</span>
              </div>
              <footer className="flex justify-between border-t border-black/10 pt-4 text-[10px] font-black">
                <span>
                  {category.levelRefs
                    .map(gauntletLevelNumber)
                    .filter((levelNumber) => levelNumber > 0)
                    .map((levelNumber) => `第${levelNumber}关`)
                    .join(" · ")}
                </span>
                <i>→</i>
              </footer>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
