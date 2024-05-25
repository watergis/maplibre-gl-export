---
"@watergis/maplibre-gl-export": patch
"@watergis/mapbox-gl-export": patch
---

fix: It has a breaking change on attribution options. `options.attributionStyle` is changed to `options.attributionOptions.style`. add `visibility` and `position` option into `options.attributionOptions`. Due to technical issue, only `top-right` or `bottom-right` position are supported currently. 
