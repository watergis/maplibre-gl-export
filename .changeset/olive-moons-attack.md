---
'@watergis/maplibre-gl-export': major
---

feat: draw the attribution, north icon and a new scale bar onto the exported image with a composed 2D canvas instead of adding them as symbol layers.

The exported map canvas is now composed onto a 2D canvas before being saved, and the overlays are drawn on top of it. A `ScaleControl` and an `AttributionControl` are added to the hidden map used for rendering, and their elements are rasterized and drawn onto the exported image, keeping maplibre's native styling. This removes the limitations of the previous symbol layer approach:

- the attribution no longer requires the `glyphs` property in the style
- the attribution and the north icon are no longer hidden at zoom levels below 2
- the attribution can now be placed in any of the four corners
- a scale bar is exported for the first time, and can be toggled from the export panel together with the north icon

### Usage

The scale bar and north icon can be toggled from the export panel, and both overlays can be configured through `MaplibreExportControl`:

```ts
import { MaplibreExportControl, Size, PageOrientation, Format, DPI } from '@watergis/maplibre-gl-export';

const exportControl = new MaplibreExportControl({
  PageSize: Size.A3,
  PageOrientation: PageOrientation.Landscape,
  Format: Format.PNG,
  DPI: DPI[300],
  // attribution: rasterized from maplibre's own AttributionControl (keeps native styling)
  attributionOptions: {
    visibility: 'visible',
    position: 'bottom-right', // any of the four corners
    margin: 10, // distance from the map edge at 96 DPI
    compact: false,
    customAttribution: '© My Company'
  },
  // scale bar: exported for the first time
  scalebarOptions: {
    visibility: 'visible',
    position: 'bottom-left',
    margin: 10,
    maxWidth: 100,
    unit: 'metric' // 'metric' | 'imperial' | 'nautical'
  },
  // north icon
  northIconOptions: {
    visibility: 'visible',
    position: 'top-right',
    margin: 10
  }
});

map.addControl(exportControl, 'top-right');
```

### Breaking changes

`attributionOptions.style` (`textSize`, `textColor`, `textHaloColor`, `textHaloWidth`, `fallbackTextFont`) has been removed. The attribution is now rasterized from maplibre's own `AttributionControl` element, so it keeps the library's native styling and there is nothing to configure. `attributionOptions` now accepts `compact` and `customAttribution` of maplibre's `AttributionControlOptions`, plus `visibility`, `position` (any of the four corners) and `margin`.
