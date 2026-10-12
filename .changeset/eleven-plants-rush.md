---
"@watergis/mapbox-gl-export": patch
---

fix: MapLibre GL JS is no longer bundled into mapbox-gl-export. It was never used at runtime, and it made the build fail with MapLibre GL JS v6, which is ESM-only. The bundle size is reduced as follows.

| File                      | Before  | After  | Reduction |
| ------------------------- | ------- | ------ | --------- |
| `mapbox-gl-export.es.js`  | 1.97 MB | 600 kB | -69%      |
| `mapbox-gl-export.umd.js` | 1.85 MB | 824 kB | -56%      |
