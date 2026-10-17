---
'@watergis/mapbox-gl-export': major
---

feat: replaced the export panel with an export dialog with a preview

- The print button opens a modal dialog with a live preview of the exported page on the left and the settings (page size, orientation, format, DPI, scale bar, north icon and file name) on the right.
- The preview can be zoomed from 50% to 300% with the buttons above it (click the percentage to reset to 100%) and, when zoomed in, dragged to look at the details. The format is chosen with a segmented control and the DPI with a slider.
- **Adjust area on map** hides the dialog and shows the page on the map with a crosshair. Move, zoom or rotate the map, then press **Done** to return to the dialog.
- **Save** asks where to save the file in Chrome / Edge (File System Access API) and downloads it in other browsers.
- Icons are from Lucide. The dialog can be restyled with the `mapboxgl-export-*` classes and the `--gl-export-*` custom properties (see the comment at the top of `mapbox-gl-export.css`).

BREAKING CHANGES:

- The `Crosshair` and `PrintableArea` options were removed. Both are shown while the area is adjusted on the map.
- The `Generate` translation was removed, and `Title`, `Close`, `Save`, `FileName`, `Landscape`, `Portrait`, `PreviewHint`, `ExportFailed`, `PreviewFailed`, `AdjustArea`, `AdjustAreaHint`, `Done` and `Cancel` were added.
- `generateMap()` of the control was replaced by `exportMap()` / `createGenerator()`.
- The `.mapboxgl-export-list` styles were replaced by the dialog styles.
- `MapGenerator` no longer shows a loader over the map while it renders, and the `.map-export-loader` styles were removed. The dialog shows its own progress and stays open until the map is saved.
