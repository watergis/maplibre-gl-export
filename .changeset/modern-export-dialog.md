---
'@watergis/maplibre-gl-export': major
'@watergis/mapbox-gl-export': major
---

feat: replaced the export panel with a modal export dialog

- The print button opens a dialog with the settings on the right and, on the left, a preview which is the exported image itself (rendered at a lower DPI). The exported area is adjusted on the map itself (**Adjust area on map**: the dialog is hidden and the page is shown on the map with `PrintableAreaManager` and `CrosshairManager` until **Done**).
- The file name can be set in the dialog. Save asks where to save the file through the File System Access API (Chrome / Edge), and downloads it in other browsers.
- Icons of the dialog are from Lucide (`lucide` is a new dependency). They and the whole dialog can be restyled from CSS through `{prefix}-export-*` classes and `--gl-export-*` custom properties.
- `MapGeneratorConfig.view` exports the map from a given camera instead of the current view of the map, and `MapGeneratorConfig.showLoader` hides the loader over the map while rendering. `generate()` now resolves to whether the map was exported.

BREAKING CHANGES:

- The `Crosshair` and `PrintableArea` options were removed: the crosshair and the printable area are shown while the area is adjusted on the map. `PrintableAreaManager` fits the page into the map instead of drawing it at 96 DPI.
- `generateMap()` of the control was replaced by `exportMap()` / `createGenerator()`.
- The `Generate` translation was removed and new translations were added.
- The `.{prefix}-export-list` styles were replaced by the dialog styles.
