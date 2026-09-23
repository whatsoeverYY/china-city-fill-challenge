"use client";

import { useEffect, useRef, useState } from "react";

type Viewport = { scale: number; x: number; y: number };

export function useSvgMapViewport(width: number, height: number) {
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
    scale: number;
    unitsPerPixelX: number;
    unitsPerPixelY: number;
  } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pendingViewportRef = useRef<Viewport | null>(null);

  const discardPendingViewport = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    pendingViewportRef.current = null;
  };

  useEffect(() => () => discardPendingViewport(), []);

  const clamp = (next: Viewport): Viewport => {
    const maxX = (width * (next.scale - 1)) / 2;
    const maxY = (height * (next.scale - 1)) / 2;
    return {
      scale: next.scale,
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  };

  const changeScale = (delta: number) => {
    discardPendingViewport();
    setViewport((current) => {
      const scale = Math.max(1, Math.min(5, current.scale + delta));
      return clamp({
        ...current,
        scale,
        x: scale <= 1 ? 0 : current.x,
        y: scale <= 1 ? 0 : current.y,
      });
    });
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (viewport.scale <= 1) return;
    discardPendingViewport();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: viewport.x,
      y: viewport.y,
      scale: viewport.scale,
      unitsPerPixelX: width / rect.width,
      unitsPerPixelY: height / rect.height,
    };
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = (event.clientX - drag.clientX) * drag.unitsPerPixelX;
    const dy = (event.clientY - drag.clientY) * drag.unitsPerPixelY;
    pendingViewportRef.current = clamp({
      scale: drag.scale,
      x: drag.x + dx,
      y: drag.y + dy,
    });
    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      const pendingViewport = pendingViewportRef.current;
      pendingViewportRef.current = null;
      if (pendingViewport) setViewport(pendingViewport);
    });
  };

  const stopDragging = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const onWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    changeScale(event.deltaY < 0 ? 0.35 : -0.35);
  };

  return {
    viewport,
    transform: `translate(${width / 2 + viewport.x} ${height / 2 + viewport.y}) scale(${viewport.scale}) translate(${-width / 2} ${-height / 2})`,
    zoomIn: () => changeScale(0.5),
    zoomOut: () => changeScale(-0.5),
    reset: () => {
      discardPendingViewport();
      setViewport({ scale: 1, x: 0, y: 0 });
    },
    svgProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: stopDragging,
      onPointerCancel: stopDragging,
      onWheel,
    },
  };
}
