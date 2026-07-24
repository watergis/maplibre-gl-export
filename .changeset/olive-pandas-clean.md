---
"@watergis/maplibre-gl-export": patch
"@watergis/mapbox-gl-export": patch
---

fix: remove the duplicated `text-align` declaration from the export list button style. `text-align: right` was overridden by `text-align: center` on the next line, so only the dead declaration is dropped and the rendering is unchanged.
