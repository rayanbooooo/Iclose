"use client";

import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeInstance } from "globe.gl";
import { Minus, Plus, RotateCcw } from "lucide-react";

const INITIAL_VIEW = { lat: 30, lng: -10, altitude: 1.5 };
const MIN_ALTITUDE = 0.5;
const MAX_ALTITUDE = 3.2;

const UP_COLOR = "#22c55e";
const DOWN_COLOR = "#ef4444";
const NEUTRAL_COLOR = "#a78bfa";
const UP_RGB = "34, 197, 94";
const DOWN_RGB = "239, 68, 68";
const NEUTRAL_RGB = "167, 139, 250";
const HOME_LAT = 38.9;
const HOME_LNG = -77.04;

export interface GlobeMarker {
  lat: number;
  lng: number;
  /** Short code shown persistently on the globe, e.g. "EUR" or "US". */
  code: string;
  pair: string;
  displayValue: string;
  tooltip: string;
  changePercentage: number | null;
  isHome?: boolean;
}

function markerColor(m: GlobeMarker): string {
  if (m.changePercentage === null) return NEUTRAL_COLOR;
  if (m.changePercentage > 0) return UP_COLOR;
  if (m.changePercentage < 0) return DOWN_COLOR;
  return NEUTRAL_COLOR;
}

function markerRgb(m: GlobeMarker): string {
  if (m.changePercentage === null) return NEUTRAL_RGB;
  if (m.changePercentage > 0) return UP_RGB;
  if (m.changePercentage < 0) return DOWN_RGB;
  return NEUTRAL_RGB;
}

function markerRadius(m: GlobeMarker): number {
  const magnitude = m.changePercentage === null ? 0.3 : Math.min(Math.abs(m.changePercentage) * 0.55, 1.1);
  return (m.isHome ? 0.45 : 0.32) + magnitude;
}

/**
 * Real currency "home" coordinates cluster tightly in places (EUR/GBP/CHF
 * are all within a few hundred km of each other), which makes their
 * persistent text labels overlap at any zoom level that still shows the
 * whole globe. Rather than fudging real geography for legibility, stack
 * each cluster member's label at a different altitude above the surface —
 * dots stay at their true position, labels fan out vertically.
 */
function withLabelAltitude(points: GlobeMarker[]): (GlobeMarker & { labelAltitude: number })[] {
  const CLUSTER_THRESHOLD_DEG = 12;
  const BASE_ALTITUDE = 0.02;
  const STEP = 0.055;

  const altitudes = new Array(points.length).fill(BASE_ALTITUDE);
  const visited = new Array(points.length).fill(false);

  for (let i = 0; i < points.length; i++) {
    if (visited[i]) continue;
    visited[i] = true;
    const cluster = [i];
    for (let j = i + 1; j < points.length; j++) {
      if (visited[j]) continue;
      const dist = Math.hypot(points[i].lat - points[j].lat, points[i].lng - points[j].lng);
      if (dist < CLUSTER_THRESHOLD_DEG) {
        visited[j] = true;
        cluster.push(j);
      }
    }
    cluster.forEach((idx, k) => {
      altitudes[idx] = BASE_ALTITUDE + k * STEP;
    });
  }

  return points.map((point, i) => ({ ...point, labelAltitude: altitudes[i] }));
}

export function FxGlobe({ points }: { points: GlobeMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const [autoRotating, setAutoRotating] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const labelPoints = withLabelAltitude(points);

    const globe: GlobeInstance = new Globe(container, { rendererConfig: { antialias: true, alpha: true } })
      .globeImageUrl("/globe/earth-night.jpg")
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor("#8b5cf6")
      .atmosphereAltitude(0.22)
      .width(container.clientWidth)
      .height(container.clientHeight)
      // Base glowing dot per market.
      .pointsData(points)
      .pointLat("lat")
      .pointLng("lng")
      .pointColor((d) => markerColor(d as GlobeMarker))
      .pointAltitude(0.012)
      .pointRadius((d) => markerRadius(d as GlobeMarker))
      .pointResolution(32)
      .pointLabel((d) => (d as GlobeMarker).tooltip)
      // Persistent always-visible pair/rate labels, matching the reference
      // dashboard's badge style instead of hover-only tooltips.
      .labelsData(labelPoints)
      .labelLat("lat")
      .labelLng("lng")
      .labelText((d) => {
        const m = d as GlobeMarker;
        if (m.changePercentage === null) return m.code;
        const arrow = m.changePercentage >= 0 ? "▲" : "▼";
        return `${m.code} ${arrow}${Math.abs(m.changePercentage).toFixed(1)}%`;
      })
      .labelColor((d) => markerColor(d as GlobeMarker))
      .labelSize((d) => ((d as GlobeMarker).isHome ? 1.5 : 1.25))
      .labelDotRadius(0)
      .labelAltitude("labelAltitude")
      .labelResolution(6)
      .labelIncludeDot(false)
      // Slow radar-style pulse rings on every marker so the globe reads as
      // "live" rather than a set of static dots.
      .ringsData(points)
      .ringLat("lat")
      .ringLng("lng")
      .ringColor((d: object) => {
        const rgb = markerRgb(d as GlobeMarker);
        return (t: number) => `rgba(${rgb}, ${Math.sqrt(Math.max(0, 1 - t)) * 0.65})`;
      })
      .ringMaxRadius((d) => markerRadius(d as GlobeMarker) * 4.5)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod((d) => ((d as GlobeMarker).isHome ? 2400 : 3200))
      // Connecting arcs from the home market to every tracked currency, so
      // the globe reads as one connected picture rather than loose dots.
      .arcsData(points.filter((p) => !p.isHome).map((p) => ({ ...p, startLat: HOME_LAT, startLng: HOME_LNG })))
      .arcStartLat("startLat")
      .arcStartLng("startLng")
      .arcEndLat("lat")
      .arcEndLng("lng")
      .arcColor((d: object) => {
        const rgb = markerRgb(d as GlobeMarker);
        return [`rgba(${rgb}, 0)`, `rgba(${rgb}, 0.55)`];
      })
      .arcStroke(0.35)
      .arcDashLength(0.4)
      .arcDashGap(2)
      .arcDashAnimateTime(3500)
      .arcAltitude(0.18);

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.35;
    globe.controls().enableZoom = true;
    globe.controls().minDistance = 100 + MIN_ALTITUDE * 100;
    globe.controls().maxDistance = 100 + MAX_ALTITUDE * 100;
    globe.pointOfView(INITIAL_VIEW, 0);

    // Manual interaction (drag or scroll) stops the auto-rotate so the user
    // stays where they left it, until they hit reset.
    globe.controls().addEventListener("start", () => {
      globe.controls().autoRotate = false;
      setAutoRotating(false);
    });

    globeRef.current = globe;

    const resizeObserver = new ResizeObserver(() => {
      globe.width(container.clientWidth).height(container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      globe._destructor();
      globeRef.current = null;
      container.replaceChildren();
    };
  }, [points]);

  const zoomBy = (factor: number) => {
    const globe = globeRef.current;
    if (!globe) return;
    const current = globe.pointOfView();
    const altitude = Math.min(MAX_ALTITUDE, Math.max(MIN_ALTITUDE, current.altitude * factor));
    globe.pointOfView({ altitude }, 400);
  };

  const resetView = () => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.pointOfView(INITIAL_VIEW, 600);
    globe.controls().autoRotate = true;
    setAutoRotating(true);
  };

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[520px] w-full cursor-grab active:cursor-grabbing" />
      <div className="absolute right-3 bottom-3 flex flex-col gap-1 rounded-lg border border-border/60 bg-card/80 p-1 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          aria-label="Zoom in"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          aria-label="Zoom out"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Reset view"
          className={`flex size-7 items-center justify-center rounded-md transition-colors hover:bg-secondary hover:text-foreground ${autoRotating ? "text-primary" : "text-muted-foreground"}`}
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
