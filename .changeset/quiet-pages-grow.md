---
"@watergis/maplibre-gl-export": patch
"@watergis/mapbox-gl-export": patch
---

fix: the vector PDF failed with `Maximum call stack size exceeded` for a large page size or a high DPI (e.g. A2, or 200/300/400 DPI), when the map has layers which are rendered as images such as raster or hillshade layers.
