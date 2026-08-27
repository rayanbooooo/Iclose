"use client";

import { useEffect, useRef } from "react";
import Globe, { type GlobeInstance } from "globe.gl";

export interface GlobePoint {
  lat: number;
  lng: number;
  label: string;
  color: string;
  radius: number;
}

export function FxGlobe({ points }: { points: GlobePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const globe: GlobeInstance = new Globe(container, { rendererConfig: { antialias: true, alpha: true } })
      .globeImageUrl("/globe/earth-dark.jpg")
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor("#8b5cf6")
      .atmosphereAltitude(0.2)
      .width(container.clientWidth)
      .height(container.clientHeight)
      .pointsData(points)
      .pointLat("lat")
      .pointLng("lng")
      .pointColor("color")
      .pointAltitude(0.012)
      .pointRadius("radius")
      .pointResolution(24)
      .pointLabel("label");

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.6;
    globe.controls().enableZoom = false;
    globe.pointOfView({ lat: 25, lng: -20, altitude: 2.3 }, 0);

    const resizeObserver = new ResizeObserver(() => {
      globe.width(container.clientWidth).height(container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      globe._destructor();
      container.replaceChildren();
    };
  }, [points]);

  return <div ref={containerRef} className="h-[480px] w-full cursor-grab active:cursor-grabbing" />;
}
