---
"@watergis/mapbox-gl-export": patch
---

fix: MapLibre GL JS is no longer bundled into mapbox-gl-export. It was never used at runtime, and it made the build fail with MapLibre GL JS v6, which is ESM-only. The bundle size is reduced to about one third.
