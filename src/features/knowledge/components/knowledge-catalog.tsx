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
  type KnowledgeTone,
} from "@/features/knowledge/data/knowledge-data";
import { knowledgeCategoryPath } from "@/features/knowledge/config/knowledge-routes";

const KNOWLEDGE_TONE_CLASSES: Record<KnowledgeTone, {
  accent: string;
  card: string;
  icon: string;
}> = {
  red: {
    accent: "text-city-600",
    card: "border-city-600/30 bg-paper-100/90 bg-tone-city hover:shadow-tone-city",
    icon: "bg-city-600",
  },
  green: {
    accent: "text-jade-500",
    card: "border-jade-500/30 bg-paper-100/90 bg-tone-jade hover:shadow-tone-jade",
    icon: "bg-jade-500",
  },
  blue: {
    accent: "text-atlas-500",
    card: "border-atlas-500/30 bg-paper-100/90 bg-tone-atlas hover:shadow-tone-atlas",
    icon: "bg-atlas-500",
  },
  gold: {
    accent: "text-gold-700",
    card: "border-gold-700/30 bg-paper-100/90 bg-tone-gold hover:shadow-tone-gold",
    icon: "bg-gold-700",
  },
  purple: {
    accent: "text-scholar-500",
    card: "border-scholar-500/30 bg-paper-100/90 bg-tone-scholar hover:shadow-tone-scholar",
    icon: "bg-scholar-500",
  },
};

export default function KnowledgeCatalog() {
  return (
    <>
      <section className="knowledge-home-hero mx-auto grid w-[min(1380px,calc(100%_-_48px))] grid-cols-[minmax(0,1.55fr)_minmax(280px,.45fr)] items-end gap-[clamp(32px,4vw,60px)] pb-11 pt-[clamp(40px,4vw,64px)] max-lg:grid-cols-1 max-sm:w-[calc(100%_-_24px)] max-sm:gap-4 max-sm:pb-6 max-sm:pt-4">
        <div>
          <p className="eyebrow m-0 text-[11px] font-black tracking-[0.16em] text-city-500 max-sm:text-[10px]">把答案串成真正记得住的知识</p>
          <h1 className="mb-4 mt-3 max-w-[900px] font-serif text-display font-black tracking-[-0.03em] max-sm:my-3 max-sm:text-display-mobile">先理解，再挑战。<br /><span className="text-scholar-500">让每个答案都有位置。</span></h1>
          <p className="m-0 max-w-[780px] text-body text-ink-600 max-sm:text-body-mobile">
            覆盖全部关卡会用到的省份、城市、车牌、名校、邻省和疆域知识，并加入长江黄河、易混城市与读图方法。
          </p>
        </div>
        <div className="knowledge-coverage-card relative overflow-hidden rounded-[22px_22px_22px_7px] border border-scholar-500/20 bg-scholar-100/90 p-6 shadow-[0_22px_50px_rgba(72,53,82,.1)] after:absolute after:-right-[25px] after:-top-[35px] after:size-[120px] after:rounded-full after:border-[18px] after:border-scholar-500/5 max-md:hidden">
          <span className="text-meta font-black tracking-widest text-scholar-500">关卡知识覆盖</span>
          <strong className="my-[10px] block font-numeric text-[58px] font-bold leading-none text-scholar-500">
            {GAUNTLET_LEVEL_COUNT}<small className="text-xl">/{GAUNTLET_LEVEL_COUNT}</small>
          </strong>
          <div className="h-[7px] overflow-hidden rounded-full bg-scholar-300"><i className="block h-full w-full bg-gradient-to-r from-scholar-500 to-city-500" /></div>
          <p className="mb-0 mt-4 text-meta text-scholar-600">错题复仇赛与终极混战，会复用前面专题中的知识。</p>
        </div>
      </section>

      <section className="knowledge-stat-strip mx-auto grid w-[min(1380px,100%)] grid-cols-4 border-y border-black/[.13] bg-card/60 max-sm:hidden" aria-label="知识库收录概况">
        {[
          [String(PROVINCES.length), "省级行政区"],
          [String(CITY_PLATE_PREFIX_COUNT), "车牌前缀"],
          [String(UNIVERSITY_QUIZ_DATA.length), "985 · 211 高校"],
          [String(CONFUSABLE_CITY_PAIRS.length), "易混城市组"],
        ].map(([value, label], index) => (
          <div className={`flex min-h-24 items-center justify-center gap-[13px] px-[26px] py-[18px] ${index > 0 ? "border-l border-black/[.13]" : ""}`} key={label}>
            <strong className="font-numeric text-3xl font-bold text-city-900">{value}</strong>
            <span className="text-meta font-extrabold tracking-[0.07em] text-ink-500">{label}</span>
          </div>
        ))}
      </section>

      <section className="knowledge-catalog mx-auto w-[min(1380px,calc(100%_-_48px))] py-[52px] pb-[72px] max-sm:w-[calc(100%_-_24px)] max-sm:py-7" aria-labelledby="knowledge-catalog-title">
        <div className="knowledge-section-heading mb-6 flex items-end justify-between gap-6 max-md:block max-sm:mb-4">
          <div>
            <p className="eyebrow m-0 text-[11px] font-black tracking-[0.16em] text-city-500 max-sm:text-[10px]">选择一个专题</p>
            <h2 className="mb-0 mt-2 font-serif text-section max-sm:text-section-mobile" id="knowledge-catalog-title">九种记忆方式，建立一张知识网</h2>
          </div>
          <p className="m-0 max-w-[380px] text-right text-compact text-ink-500 max-sm:hidden">每张卡片都标明关联关卡，学完可以直接回游戏验证。</p>
        </div>
        <div className="knowledge-category-grid grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {KNOWLEDGE_CATEGORIES.map((category, index) => (
            <a
              className={`knowledge-category-card relative grid min-h-[220px] cursor-pointer grid-cols-[58px_minmax(0,1fr)] content-start gap-5 overflow-hidden rounded-[20px_20px_20px_7px] border p-[22px] text-left text-ink no-underline shadow-[0_15px_35px_rgba(59,48,34,.06)] transition hover:-translate-y-1 max-sm:min-h-0 max-sm:grid-cols-[44px_minmax(0,1fr)_auto] max-sm:items-center max-sm:gap-3 max-sm:rounded-[15px_15px_15px_5px] max-sm:p-3 ${KNOWLEDGE_TONE_CLASSES[category.tone].card}`}
              href={knowledgeCategoryPath(category.id)}
              key={category.id}
            >
              <span className={`knowledge-category-number absolute right-[18px] top-[17px] font-numeric text-sm font-bold opacity-30 max-sm:hidden ${KNOWLEDGE_TONE_CLASSES[category.tone].accent}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <b className={`grid size-[58px] place-items-center rounded-[17px_17px_17px_5px] font-serif text-[25px] text-white shadow-[inset_0_0_0_3px_rgba(255,255,255,.12)] max-sm:size-11 max-sm:rounded-[13px_13px_13px_4px] max-sm:text-xl ${KNOWLEDGE_TONE_CLASSES[category.tone].icon}`} aria-hidden="true">{category.icon}</b>
              <div className="pt-0.5">
                <p className={`mb-2 mt-0 text-meta font-black tracking-[0.09em] max-sm:mb-1 ${KNOWLEDGE_TONE_CLASSES[category.tone].accent}`}>{category.memoryStyle} · {CATEGORY_TOTAL_LABELS[category.id]}</p>
                <h3 className="m-0 font-serif text-card-title max-sm:text-card-title-mobile">{category.title}</h3>
                <span className="mt-2.5 block text-compact text-ink-500 max-sm:hidden">{category.subtitle}</span>
              </div>
              <footer className="col-span-full mt-auto flex items-end justify-between gap-3 border-t border-black/10 pt-[18px] max-sm:col-auto max-sm:border-0 max-sm:p-0">
                <span className="max-w-[90%] text-meta font-extrabold text-stone-600 max-sm:hidden">
                  {category.levelRefs
                    .map(gauntletLevelNumber)
                    .filter((levelNumber) => levelNumber > 0)
                    .map((levelNumber) => `第${levelNumber}关`)
                    .join(" · ")}
                </span>
                <i className={`text-[19px] not-italic ${KNOWLEDGE_TONE_CLASSES[category.tone].accent}`}>→</i>
              </footer>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
