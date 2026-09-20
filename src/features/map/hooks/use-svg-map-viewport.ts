"use client";

import { useRef, useState } from "react";

type Viewport = { scale: number; x: number; y: number };

export function useSvgMapViewport(width: number, height: number) {
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null>(null);

  const clamp = (next: Viewport): Viewport => {
    const maxX = (width * (next.scale - 1)) / 2;
    const maxY = (height * (next.scale - 1)) / 2;
    return {
      scale: next.scale,
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  };

  const setScale = (nextScale: number) => {
    setViewport((current) => clamp({
      ...current,
      scale: Math.max(1, Math.min(5, nextScale)),
      x: nextScale <= 1 ? 0 : current.x,
      y: nextScale <= 1 ? 0 : current.y,
    }));
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (viewport.scale <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: viewport.x,
      y: viewport.y,
    };
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = ((event.clientX - drag.clientX) * width) / rect.width;
    const dy = ((event.clientY - drag.clientY) * height) / rect.height;
    setViewport(clamp({ ...viewport, x: drag.x + dx, y: drag.y + dy }));
  };

  const stopDragging = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const onWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    setScale(viewport.scale + (event.deltaY < 0 ? 0.35 : -0.35));
  };

  return {
    viewport,
    transform: `translate(${width / 2 + viewport.x} ${height / 2 + viewport.y}) scale(${viewport.scale}) translate(${-width / 2} ${-height / 2})`,
    zoomIn: () => setScale(viewport.scale + 0.5),
    zoomOut: () => setScale(viewport.scale - 0.5),
    reset: () => setViewport({ scale: 1, x: 0, y: 0 }),
    svgProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: stopDragging,
      onPointerCancel: stopDragging,
      onWheel,
    },
  };
}
