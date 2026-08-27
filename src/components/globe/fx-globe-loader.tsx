"use client";

import dynamic from "next/dynamic";
import type { GlobePoint } from "./fx-globe";

// globe.gl touches `window`/WebGL at module scope, so it must never be
// evaluated during server rendering — dynamic import with ssr:false is the
// only way to guarantee that from a page that's otherwise a Server Component.
const FxGlobe = dynamic(() => import("./fx-globe").then((m) => m.FxGlobe), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center text-sm text-muted-foreground">
      Loading globe…
    </div>
  ),
});

export function FxGlobeLoader({ points }: { points: GlobePoint[] }) {
  return <FxGlobe points={points} />;
}
