---
"@watergis/maplibre-gl-export": patch
"@watergis/mapbox-gl-export": patch
---

fix: keep the metadata of the style images when they are copied to the map used for exporting. `pixelRatio`, `sdf`, `stretchX/Y` and `content` were dropped, so high resolution icons were exported at their full bitmap size and `icon-color` was no longer applied to SDF icons. The mapbox plugin additionally failed to copy any image at all, because mapbox-gl v3 keeps them in a nested `Map` instead of a plain object.
