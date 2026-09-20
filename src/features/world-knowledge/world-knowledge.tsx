"use client";

import { useMemo, useState } from "react";
import { WORLD_CONTINENTS } from "@/domain/geography/data/world-continents";
import {
  WORLD_COUNTRIES,
  WORLD_COUNTRY_CATALOG,
} from "@/domain/geography/data/world-countries";
import {
  WORLD_COUNTRY_DATA_NOTICE,
  WORLD_BOUNDARY_DISCLAIMER,
  WORLD_MAP_DATA_NOTICE,
} from "@/domain/geography/data/world-data-policy";
import AppLink from "@/shared/components/app-link";
import DataVintageNotice from "@/shared/components/data-vintage-notice";
import PageBreadcrumbs from "@/shared/components/page-breadcrumbs";
import { routePath } from "@/shared/lib/app-path";

function searchableCountryText(country: (typeof WORLD_COUNTRIES)[number]) {
  return [
    country.name,
    country.englishName,
    ...country.aliases,
    country.continentName,
    ...country.capitals.flatMap((capital) => [capital.name, capital.englishName]),
  ].join(" ").toLocaleLowerCase();
}

export default function WorldKnowledge() {
  const [query, setQuery] = useState("");
  const [continentId, setContinentId] = useState("all");
  const countries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return WORLD_COUNTRIES.filter((country) =>
      (continentId === "all" || country.continentId === continentId) &&
      (!normalizedQuery || searchableCountryText(country).includes(normalizedQuery))
    );
  }, [continentId, query]);

  return (
    <main className="mx-auto min-h-dvh w-[min(1320px,calc(100%_-_48px))] pb-20 pt-8 text-ink max-md:w-[min(720px,calc(100%_-_24px))] max-md:pt-4">
      <PageBreadcrumbs items={[
        { label: "中国篇", href: routePath("/") },
        { label: "世界篇", href: routePath("/world") },
        { label: "世界地理知识" },
      ]} />

      <header className="mt-7 rounded-[28px_28px_28px_8px] border border-scholar-500/20 bg-scholar-100/65 px-7 py-9 max-sm:px-5">
        <p className="m-0 text-meta font-black uppercase tracking-[0.22em] text-scholar-700">WORLD KNOWLEDGE</p>
        <h1 className="mb-3 mt-2 font-serif text-display font-black max-sm:text-display-mobile">国家、首都与七大洲</h1>
        <p className="m-0 max-w-[850px] text-body text-ink-soft">本期采用 195 国学习口径：193 个联合国会员国，加巴勒斯坦与梵蒂冈两个观察员国。部分国家存在多首都、法定首都与政府所在地不同等情况，目录会明确标注角色。</p>
      </header>

      <div className="mt-5">
        <DataVintageNotice lines={[WORLD_COUNTRY_DATA_NOTICE, WORLD_MAP_DATA_NOTICE, WORLD_BOUNDARY_DISCLAIMER]} />
      </div>

      <section className="mt-7 grid grid-cols-3 gap-4 max-sm:grid-cols-1" aria-label="世界地理概览">
        {[
          [String(WORLD_COUNTRY_CATALOG.countryCount), "国家学习口径"],
          [String(WORLD_CONTINENTS.length), "七大洲"],
          [String(WORLD_COUNTRIES.reduce((total, country) => total + country.capitals.length, 0)), "首都与行政中心条目"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-[20px_20px_20px_6px] border border-black/10 bg-card/85 p-5">
            <strong className="block font-numeric text-page text-scholar-700">{value}</strong>
            <span className="text-compact font-bold text-ink-soft">{label}</span>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <p className="m-0 text-meta font-black uppercase tracking-[0.18em] text-scholar-700">CONTINENTS</p>
          <h2 className="mb-0 mt-1 font-serif text-section font-bold">七大洲速览</h2>
        </div>
        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
          {WORLD_CONTINENTS.map((continent) => (
            <article key={continent.id} className="rounded-[18px_18px_18px_6px] border border-scholar-500/15 bg-card/80 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="m-0 font-serif text-card-title font-bold">{continent.name}</h3>
                <strong className="font-numeric text-xl text-scholar-700">{continent.countryCount}</strong>
              </div>
              <p className="mb-2 mt-1 text-meta font-bold uppercase tracking-[0.1em] text-ink-500">{continent.englishName}</p>
              <p className="m-0 text-compact text-ink-soft">{continent.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-5 max-md:block">
          <div>
            <p className="m-0 text-meta font-black uppercase tracking-[0.18em] text-scholar-700">COUNTRIES & CAPITALS</p>
            <h2 className="mb-0 mt-1 font-serif text-section font-bold">国家与首都目录</h2>
          </div>
          <AppLink className="inline-flex min-h-11 items-center rounded-full bg-gold-700 px-5 py-2.5 text-compact font-black text-white no-underline max-md:mt-4" href={routePath("/world/gauntlet")}>学完去闯关</AppLink>
        </div>

        <div className="mt-5 grid grid-cols-[minmax(220px,1fr)_minmax(180px,280px)] gap-3 max-sm:grid-cols-1">
          <label className="grid gap-1 text-meta font-bold text-ink-soft">
            搜索国家或首都
            <input className="min-h-11 rounded-xl border border-black/15 bg-card px-4 text-body text-ink outline-none focus:border-scholar-500" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：中国、北京、France、Paris" />
          </label>
          <label className="grid gap-1 text-meta font-bold text-ink-soft">
            按洲筛选
            <select className="min-h-11 rounded-xl border border-black/15 bg-card px-3 text-body text-ink outline-none focus:border-scholar-500" value={continentId} onChange={(event) => setContinentId(event.target.value)}>
              <option value="all">全部洲别</option>
              {WORLD_CONTINENTS.filter((continent) => continent.countryCount > 0).map((continent) => (
                <option value={continent.id} key={continent.id}>{continent.name} · {continent.countryCount} 国</option>
              ))}
            </select>
          </label>
        </div>

        <p className="mb-3 mt-4 text-compact font-bold text-ink-soft">当前显示 {countries.length} 个国家</p>
        <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1" aria-live="polite">
          {countries.map((country) => (
            <article key={country.id} className="rounded-[17px_17px_17px_5px] border border-black/10 bg-card/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="m-0 font-serif text-card-title font-bold">{country.name}</h3>
                  <p className="mb-3 mt-1 text-meta font-bold text-ink-500">{country.englishName} · {country.continentName}</p>
                </div>
                <span className="rounded-full border border-scholar-500/20 bg-scholar-100 px-2 py-1 text-meta font-black text-scholar-700">{country.isoAlpha3}</span>
              </div>
              <ul className="m-0 grid list-none gap-2 p-0">
                {country.capitals.map((capital) => (
                  <li key={`${country.id}-${capital.englishName}`} className="rounded-xl bg-paper-200/80 px-3 py-2 text-compact">
                    <strong>{capital.name}</strong>
                    <span className="ml-2 text-ink-soft">{capital.englishName}</span>
                    <small className="mt-1 block text-meta font-bold text-clay-700">{capital.role}</small>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        {countries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/15 bg-card/60 px-5 py-8 text-center text-body text-ink-soft">没有匹配的国家或首都，请换一个关键词。</p>
        ) : null}
      </section>

      <footer className="mt-12 rounded-2xl border border-black/10 bg-paper-200/70 p-5 text-compact text-ink-soft">
        <strong className="text-ink">资料与边界说明：</strong>
        国家口径参考 <a className="font-bold text-atlas-700" href="https://unstats.un.org/unsd/methodology/m49/" target="_blank" rel="noreferrer">联合国 M49</a>；地图采用 <a className="font-bold text-atlas-700" href="https://data-gis.unep-wcmc.org/server/rest/services/Hosted/UN_Boundaries/FeatureServer" target="_blank" rel="noreferrer">UN Compliant Boundaries</a> 2026-09-20 当日快照；首都资料以 Natural Earth 点位为底稿，并通过当日 Wikidata 关系与官方变更公告逐国核验。地图用于地理学习与答题，不作为政治立场、主权或边界主张的表达；争议与特殊首都情况以文字备注为准。
      </footer>
    </main>
  );
}
