"use client";

import { useId } from "react";
import type { WorldCountry } from "@/domain/geography/data/world-countries";
import {
  WORLD_COUNTRY_DATA_NOTICE,
  WORLD_MAP_DATA_NOTICE,
} from "@/domain/geography/data/world-data-policy";
import WorldCountrySilhouette from "@/features/map/components/world-country-silhouette";
import type { WorldMapFeature } from "@/features/map/model/world-map-data";
import AppLink from "@/shared/components/app-link";
import DataVintageNotice from "@/shared/components/data-vintage-notice";
import { useModalDialog } from "@/shared/hooks/use-modal-dialog";
import { routePath } from "@/shared/lib/app-path";

export default function WorldCountryDossier({
  country,
  feature,
  onClose,
}: {
  country: WorldCountry;
  feature: WorldMapFeature;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useModalDialog(true, onClose);

  return (
    <div
      className="fixed inset-0 z-[1500] bg-ink-900/35 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="absolute right-0 top-0 h-dvh w-[min(480px,100%)] overflow-y-auto border-l border-black/10 bg-paper-100 px-6 pb-8 pt-5 shadow-2xl max-sm:bottom-0 max-sm:top-auto max-sm:h-auto max-sm:max-h-[84dvh] max-sm:rounded-t-[26px] max-sm:border-l-0 max-sm:border-t max-sm:px-4 max-sm:pb-[max(20px,env(safe-area-inset-bottom))]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-meta font-black uppercase tracking-[0.18em] text-atlas-700">COUNTRY DOSSIER · 已收录</p>
            <h2 className="mb-1 mt-2 font-serif text-page font-bold" id={titleId}>{country.name}</h2>
            <p className="m-0 text-compact font-bold text-ink-soft">{country.englishName} · {country.continentName}</p>
          </div>
          <button data-autofocus className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-black/10 bg-card text-lg font-black text-ink" type="button" onClick={onClose} aria-label="关闭国家档案">×</button>
        </div>

        <div className="rounded-[20px_20px_20px_6px] border border-atlas-500/15 bg-atlas-100/55 p-3">
          <WorldCountrySilhouette feature={feature} ariaLabel={`${country.name}的国家轮廓`} />
        </div>

        <dl className="my-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-black/10 bg-card/85 p-3">
            <dt className="text-meta font-black text-ink-soft">所属洲</dt>
            <dd className="mb-0 ml-0 mt-1 font-serif text-card-title font-bold">{country.continentName}</dd>
          </div>
          <div className="rounded-xl border border-black/10 bg-card/85 p-3">
            <dt className="text-meta font-black text-ink-soft">联合国 M49</dt>
            <dd className="mb-0 ml-0 mt-1 font-numeric text-card-title font-bold">{country.m49Code}</dd>
          </div>
        </dl>

        <section aria-labelledby={`${titleId}-capital`}>
          <h3 className="mb-3 mt-0 font-serif text-card-title font-bold" id={`${titleId}-capital`}>首都与行政中心</h3>
          <ul className="m-0 grid list-none gap-2 p-0">
            {country.capitals.map((capital) => (
              <li className="rounded-xl bg-paper-300/70 px-4 py-3" key={`${country.id}-${capital.englishName}`}>
                <strong className="text-body">{capital.name}</strong>
                <span className="ml-2 text-compact text-ink-soft">{capital.englishName}</span>
                <small className="mt-1 block text-meta font-bold text-clay-700">{capital.role}</small>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-5">
          <DataVintageNotice compact lines={[WORLD_COUNTRY_DATA_NOTICE, WORLD_MAP_DATA_NOTICE]} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          <AppLink className="inline-flex min-h-11 items-center justify-center rounded-full bg-atlas-700 px-4 py-2.5 text-compact font-black text-white no-underline" href={routePath("/world/gauntlet/world-map-country-names")}>去地图挑战</AppLink>
          <AppLink className="inline-flex min-h-11 items-center justify-center rounded-full border border-scholar-500/25 bg-scholar-100 px-4 py-2.5 text-compact font-black text-scholar-800 no-underline" href={routePath("/world/knowledge")}>查看完整目录</AppLink>
        </div>
      </section>
    </div>
  );
}
