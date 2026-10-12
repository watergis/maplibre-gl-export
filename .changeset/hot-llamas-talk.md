---
"@watergis/mapbox-gl-export": patch
"@watergis/maplibre-gl-export": patch
---

fix: when several export controls were added to the same page, the printable area preview and the generated map used the settings of another control. Form elements are now looked up within each control's own panel.
