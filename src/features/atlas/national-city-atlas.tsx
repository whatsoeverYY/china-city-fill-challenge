"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CITY_PLATE_PREFIX_COUNT } from "@/domain/geography/data/city-plates";
import { PROVINCES } from "@/domain/geography/data/provinces";
import LoadingMap from "@/features/map/components/loading-map";
import type { MapData, Position } from "@/features/map/model/map-data";
import { makeProjection, MAP_HEIGHT, MAP_WIDTH } from "@/features/map/lib/map-geometry";
import {
  ATLAS_MAX_SCALE,
  ATLAS_MIN_SCALE,
  AtlasLabels,
  AtlasProvinceOutlines,
  AtlasRegionShapes,
  atlasPointerPosition,
} from "@/features/atlas/components/atlas-map-layers";
import type {
  AtlasHoverLabel,
  AtlasProvinceDrawing,
  AtlasRegionDrawing,
  AtlasView,
} from "@/features/atlas/model/atlas-types";
import {
  createAtlasProvinceDrawings,
  createAtlasRegions,
  createProvinceFillColors,
} from "@/features/atlas/model/atlas-drawings";
import { DESKTOP_ATLAS_VIEW, initialAtlasView } from "@/features/atlas/model/atlas-view";

export default function NationalCityAtlas({
  map,
  nationalMap,
  error,
  onExit,
}: {
  map: MapData | null;
  nationalMap: MapData | null;
  error: boolean;
  onExit: () => void;
}) {
  const [view, setView] = useState<AtlasView>(DESKTOP_ATLAS_VIEW);
  const [dragging, setDragging] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [hoverLabel, setHoverLabel] = useState<AtlasHoverLabel | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    viewX: number;
    viewY: number;
  } | null>(null);
  const activePointersRef = useRef(
    new Map<number, { clientX: number; clientY: number }>(),
  );
  const pinchRef = useRef<{
    distance: number;
    midpoint: Position;
  } | null>(null);
  const project = useMemo(
    () => (map?.features.length ? makeProjection(map.features) : null),
    [map],
  );
  const provinceFillColors = useMemo(
    () => createProvinceFillColors(),
    [],
  );
  const atlasRegions = useMemo<AtlasRegionDrawing[]>(
    () => createAtlasRegions(map, project, provinceFillColors),
    [map, project, provinceFillColors],
  );
  const atlasProvinces = useMemo<AtlasProvinceDrawing[]>(
    () => createAtlasProvinceDrawings(nationalMap, project),
    [nationalMap, project],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      setView(initialAtlasView(window.matchMedia("(max-width: 768px)").matches));
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const zoomBy = useCallback(
    (factor: number, anchorX = MAP_WIDTH / 2, anchorY = MAP_HEIGHT / 2) => {
      setView((current) => {
        const scale = Math.min(
          ATLAS_MAX_SCALE,
          Math.max(ATLAS_MIN_SCALE, current.scale * factor),
        );
        if (scale === current.scale) return current;
        const mapX = (anchorX - current.x) / current.scale;
        const mapY = (anchorY - current.y) / current.scale;
        return {
          scale,
          x: anchorX - mapX * scale,
          y: anchorY - mapY * scale,
        };
      });
    },
    [],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const [anchorX, anchorY] = atlasPointerPosition(
        svg,
        event.clientX,
        event.clientY,
      );
      const deltaPixels = event.deltaY * (
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? svg.clientHeight : 1
      );
      const limitedDelta = Math.max(-120, Math.min(120, deltaPixels));
      zoomBy(Math.exp(-limitedDelta * 0.002), anchorX, anchorY);
    };
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [atlasRegions.length, zoomBy]);

  const resetView = useCallback(() => {
    setView(initialAtlasView(window.matchMedia("(max-width: 768px)").matches));
  }, []);

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    setHoverLabel(null);
    activePointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (activePointersRef.current.size >= 2) {
      const [first, second] = Array.from(activePointersRef.current.values());
      const midpointClientX = (first.clientX + second.clientX) / 2;
      const midpointClientY = (first.clientY + second.clientY) / 2;
      pinchRef.current = {
        distance: Math.hypot(
          second.clientX - first.clientX,
          second.clientY - first.clientY,
        ),
        midpoint: atlasPointerPosition(
          event.currentTarget,
          midpointClientX,
          midpointClientY,
        ),
      };
      dragRef.current = null;
      setDragging(true);
      return;
    }

    const [viewX, viewY] = atlasPointerPosition(
      event.currentTarget,
      event.clientX,
      event.clientY,
    );
    dragRef.current = {
      pointerId: event.pointerId,
      viewX,
      viewY,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!activePointersRef.current.has(event.pointerId)) return;
    activePointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    if (activePointersRef.current.size >= 2) {
      const [first, second] = Array.from(activePointersRef.current.values());
      const nextDistance = Math.hypot(
        second.clientX - first.clientX,
        second.clientY - first.clientY,
      );
      const nextMidpoint = atlasPointerPosition(
        event.currentTarget,
        (first.clientX + second.clientX) / 2,
        (first.clientY + second.clientY) / 2,
      );
      const previousPinch = pinchRef.current;
      if (previousPinch && previousPinch.distance > 0 && nextDistance > 0) {
        setView((current) => {
          const scale = Math.min(
            ATLAS_MAX_SCALE,
            Math.max(
              ATLAS_MIN_SCALE,
              current.scale * (nextDistance / previousPinch.distance),
            ),
          );
          const mapX = (previousPinch.midpoint[0] - current.x) / current.scale;
          const mapY = (previousPinch.midpoint[1] - current.y) / current.scale;
          return {
            scale,
            x: nextMidpoint[0] - mapX * scale,
            y: nextMidpoint[1] - mapY * scale,
          };
        });
      }
      pinchRef.current = { distance: nextDistance, midpoint: nextMidpoint };
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const [viewX, viewY] = atlasPointerPosition(
      event.currentTarget,
      event.clientX,
      event.clientY,
    );
    const deltaX = viewX - drag.viewX;
    const deltaY = viewY - drag.viewY;
    dragRef.current = {
      ...drag,
      viewX,
      viewY,
    };
    setView((current) => ({
      ...current,
      x: current.x + deltaX,
      y: current.y + deltaY,
    }));
  };

  const endPointerDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    activePointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    pinchRef.current = null;

    const remainingPointer = activePointersRef.current.entries().next().value as
      | [number, { clientX: number; clientY: number }]
      | undefined;
    if (remainingPointer) {
      const [pointerId, pointer] = remainingPointer;
      const [viewX, viewY] = atlasPointerPosition(
        event.currentTarget,
        pointer.clientX,
        pointer.clientY,
      );
      dragRef.current = { pointerId, viewX, viewY };
      setDragging(true);
      return;
    }

    dragRef.current = null;
    setDragging(false);
  };

  const handleRegionEnter = useCallback((
    region: AtlasRegionDrawing,
    event: React.PointerEvent<SVGPathElement>,
  ) => {
    if (labelsVisible || activePointersRef.current.size > 0) return;
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setHoverLabel({
      name: region.name,
      plate: region.plate,
      left: Math.max(8, Math.min(bounds.width - 170, event.clientX - bounds.left + 14)),
      top: Math.max(8, Math.min(bounds.height - 70, event.clientY - bounds.top + 14)),
    });
  }, [labelsVisible]);

  const handleRegionLeave = useCallback(() => {
    setHoverLabel(null);
  }, []);

  const toggleLabels = () => {
    setLabelsVisible((current) => !current);
    setHoverLabel(null);
  };

  return (
    <main className="city-atlas-shell fixed inset-0 z-[1500] grid h-dvh w-screen grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[#e9e3d6] text-ink">
      <header className="city-atlas-header z-[3] grid min-h-[82px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-7 border-b border-black/15 bg-card/95 px-5 py-3 shadow-sm max-lg:gap-3 max-md:grid-cols-[1fr_auto]">
        <div className="city-atlas-title flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-[13px_13px_13px_4px] bg-[#356b8e] text-xl font-black text-white" aria-hidden="true">图</span>
          <div>
            <p className="m-0 text-[9px] font-extrabold tracking-[0.12em] text-[#718087]">可缩放全国城市参考地图</p>
            <h1 className="m-0 text-[clamp(20px,2.2vw,30px)] font-black leading-tight">全国车牌图鉴</h1>
          </div>
        </div>
        <div className="city-atlas-summary flex justify-center gap-[clamp(12px,3vw,42px)] text-[10px] font-extrabold tracking-wide text-[#68736d] max-lg:gap-3 max-md:hidden" aria-label="图鉴数据范围">
          <span className="whitespace-nowrap"><strong className="mr-1 text-lg text-brand-red">{PROVINCES.length}</strong> 省级行政区</span>
          <span className="whitespace-nowrap"><strong className="mr-1 text-lg text-brand-red">{map?.features.length ?? "…"}</strong> 市级 / 区县区块</span>
          <span className="whitespace-nowrap"><strong className="mr-1 text-lg text-brand-red">{CITY_PLATE_PREFIX_COUNT}</strong> 个区域车牌前缀</span>
        </div>
        <button className="city-atlas-exit min-h-10 cursor-pointer rounded-full border-0 bg-brand-red-dark px-4 py-2 text-[11px] font-black text-white hover:bg-brand-red max-sm:px-3" type="button" onClick={onExit}>
          <span aria-hidden="true">←</span> 返回挑战首页
        </button>
      </header>

      <section className="city-atlas-workspace relative min-h-0 overflow-hidden">
        <div className="city-atlas-help absolute left-5 top-4 z-[2] flex max-w-[min(690px,calc(100%_-_150px))] items-center gap-4 rounded-xl border border-black/10 bg-card/90 px-3 py-2 shadow-md backdrop-blur-md max-md:left-3 max-md:max-w-[calc(100%_-_96px)] max-md:gap-2">
          <p className="m-0 flex items-center gap-1.5 whitespace-nowrap text-[9px] font-extrabold text-ink-soft max-sm:hidden"><span className="block h-0.5 w-5 bg-brand-red" />红色省界</p>
          <p className="m-0 flex items-center gap-1.5 whitespace-nowrap text-[9px] font-extrabold text-ink-soft max-sm:hidden"><span className="block h-0.5 w-5 bg-brand-green" />绿色市界 / 区县界</p>
          <p className="m-0 flex items-center gap-1.5 whitespace-nowrap text-[9px] font-extrabold text-ink-soft max-sm:hidden">滚轮或双指缩放 · 按住拖动</p>
          <button
            className={`city-atlas-label-toggle inline-flex min-h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-green/25 px-2.5 text-[9px] font-black text-brand-green-dark ${labelsVisible ? "bg-[#dfece0]" : "bg-[#edf4e9]"}`}
            type="button"
            aria-label={labelsVisible ? "隐藏全部文字" : "显示全部文字"}
            aria-pressed={labelsVisible}
            onClick={toggleLabels}
          >
            <span className="grid size-[17px] place-items-center rounded-full bg-brand-green text-[9px] text-white" aria-hidden="true">文</span>
            {labelsVisible ? "隐藏文字" : "显示文字"}
          </button>
          <small className="border-l border-black/15 pl-3 text-[9px] font-extrabold leading-4 text-ink-soft max-lg:hidden">车牌题库已收录的城市、自治州、地区和盟显示完整前缀；其余区县显示省级车牌简称。</small>
        </div>

        <div className="city-atlas-canvas relative size-full overflow-hidden bg-[#e9e3d6]">
          {error ? (
            <div className="map-error city-atlas-error absolute inset-0 grid place-content-center text-center" role="alert">
              全国市级地图加载失败，请刷新页面后重试。
            </div>
          ) : !map || !nationalMap || !project ? (
            <LoadingMap />
          ) : (
            <svg
              ref={svgRef}
              className={`city-atlas-map block size-full touch-none select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              role="img"
              aria-label="标注城市名称与车牌前缀的中国地图"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endPointerDrag}
              onPointerCancel={endPointerDrag}
            >
              <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
                <AtlasRegionShapes
                  regions={atlasRegions}
                  onRegionEnter={handleRegionEnter}
                  onRegionLeave={handleRegionLeave}
                />
                <AtlasProvinceOutlines provinces={atlasProvinces} />
                {labelsVisible ? <AtlasLabels regions={atlasRegions} /> : null}
              </g>
            </svg>
          )}

          {!labelsVisible && hoverLabel ? (
            <div
              className="city-atlas-hover-label pointer-events-none absolute z-[3] grid min-w-28 rounded-[10px_10px_10px_3px] border border-black/20 bg-card/95 px-2.5 py-2 shadow-lg"
              style={{ left: hoverLabel.left, top: hoverLabel.top }}
              role="status"
            >
              <strong className="text-[13px]">{hoverLabel.name}</strong>
              <span className="mt-0.5 text-[10px] font-black text-brand-red-dark">{hoverLabel.plate}</span>
            </div>
          ) : null}

          <div className="city-atlas-toolbar absolute bottom-5 right-5 z-[2] grid w-24 gap-2 rounded-2xl border border-black/10 bg-card/95 p-2 shadow-lg backdrop-blur-md max-md:bottom-3 max-md:right-3 max-md:w-20" aria-label="地图缩放工具栏">
            <button
              className="min-h-9 cursor-pointer rounded-lg border border-brand-green/20 bg-[#edf4e9] p-1.5 text-[10px] font-black text-brand-green-dark hover:border-brand-green hover:bg-[#dfece0] disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              aria-label="放大地图"
              disabled={view.scale >= ATLAS_MAX_SCALE}
              onClick={() => zoomBy(1.35)}
            >
              <span aria-hidden="true">＋</span> 放大
            </button>
            <output className="text-center text-xs font-bold text-[#766b5b]" aria-label="当前缩放比例">{Math.round(view.scale * 100)}%</output>
            <button
              className="min-h-9 cursor-pointer rounded-lg border border-brand-green/20 bg-[#edf4e9] p-1.5 text-[10px] font-black text-brand-green-dark hover:border-brand-green hover:bg-[#dfece0] disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              aria-label="缩小地图"
              disabled={view.scale <= ATLAS_MIN_SCALE}
              onClick={() => zoomBy(1 / 1.35)}
            >
              <span aria-hidden="true">−</span> 缩小
            </button>
            <button className="min-h-9 cursor-pointer rounded-lg border border-brand-green/20 bg-[#edf4e9] p-1.5 text-[10px] font-black text-brand-green-dark hover:border-brand-green hover:bg-[#dfece0]" type="button" onClick={resetView}>
              <span aria-hidden="true">⌂</span> 复位
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
