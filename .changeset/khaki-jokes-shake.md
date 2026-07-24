---
"@watergis/maplibre-gl-export": minor
"@watergis/mapbox-gl-export": minor
---

feat: make the generated image available to the application instead of only downloading it. `MapGenerator` now exposes `toCanvas()` and `toBlob()`, and both the generator and the export control accept a `download` option and an `onExport` callback which receives `{ canvas, blob, fileName, format }`. `MapGenerator` is exported from both packages.
