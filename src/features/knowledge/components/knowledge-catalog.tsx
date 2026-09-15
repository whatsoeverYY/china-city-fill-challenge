import { CONFUSABLE_CITY_PAIRS } from "@/domain/geography/data/confusable-cities";
import { UNIVERSITY_QUIZ_DATA } from "@/domain/geography/data/universities";
import { CITY_PLATE_PREFIX_COUNT } from "@/domain/geography/data/city-plates";
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
      <section className="knowledge-home-hero">
        <div>
          <p className="eyebrow">把答案串成真正记得住的知识</p>
          <h2>先理解，再挑战。<br /><span>让每个答案都有位置。</span></h2>
          <p>
            覆盖全部关卡会用到的省份、城市、车牌、名校、邻省和疆域知识，并加入长江黄河、易混城市与读图方法。
          </p>
        </div>
        <div className="knowledge-coverage-card">
          <span>关卡知识覆盖</span>
          <strong>
            {GAUNTLET_LEVEL_COUNT}<small>/{GAUNTLET_LEVEL_COUNT}</small>
          </strong>
          <div><i /></div>
          <p>错题复仇赛与终极混战，会复用前面专题中的知识。</p>
        </div>
      </section>

      <section className="knowledge-stat-strip" aria-label="知识库收录概况">
        <div><strong>34</strong><span>省级行政区</span></div>
        <div><strong>{CITY_PLATE_PREFIX_COUNT}</strong><span>车牌前缀</span></div>
        <div><strong>{UNIVERSITY_QUIZ_DATA.length}</strong><span>985 · 211 高校</span></div>
        <div><strong>{CONFUSABLE_CITY_PAIRS.length}</strong><span>易混城市组</span></div>
      </section>

      <section className="knowledge-catalog" aria-labelledby="knowledge-catalog-title">
        <div className="knowledge-section-heading">
          <div>
            <p className="eyebrow">选择一个专题</p>
            <h2 id="knowledge-catalog-title">九种记忆方式，建立一张知识网</h2>
          </div>
          <p>每张卡片都标明关联关卡，学完可以直接回游戏验证。</p>
        </div>
        <div className="knowledge-category-grid">
          {KNOWLEDGE_CATEGORIES.map((category, index) => (
            <button
              className={`knowledge-category-card is-${category.tone}`}
              key={category.id}
              type="button"
              onClick={() => onOpenCategory(category.id)}
            >
              <span className="knowledge-category-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <b aria-hidden="true">{category.icon}</b>
              <div>
                <p>{category.memoryStyle} · {CATEGORY_TOTAL_LABELS[category.id]}</p>
                <h3>{category.title}</h3>
                <span>{category.subtitle}</span>
              </div>
              <footer>
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
