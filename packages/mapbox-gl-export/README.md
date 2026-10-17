# mapbox-gl-export

[![version](https://img.shields.io/npm/v/@watergis/mapbox-gl-export.svg)](https://www.npmjs.com/package/@watergis/mapbox-gl-export)

This module adds control which can export PDF and images.

This module is using source code of [mpetroff/print-maps](https://github.com/mpetroff/print-maps). I just adopted this library to normal Mapbox GL Plugin. Thanks so much to develop this library!

## for MapLibre GL users

Please consider to use [maplibre-gl-export](https://github.com/watergis/maplibre-gl-export) plugin for MapLibre GL.

## Requirements

`mapbox-gl` v3 is a peer dependency, so install it together with the plugin. The map used for exporting is created with the same `mapbox-gl` as your application.

```bash
npm install mapbox-gl @watergis/mapbox-gl-export
```

## Demo & usage

See [documentation](https://maplibre-gl-export.water-gis.com/).

## Export dialog

The print button opens a dialog with a preview of the page on the left and the export settings
(page size, orientation, format, DPI, scale bar, north icon and file name) on the right.
The preview is the exported image itself, rendered at a lower resolution, so what you see is what is
saved (scale bar, north icon, attribution, labels and markers drawn as circles). Adjust the exported area
with **Adjust area on map**: the dialog is hidden and the page is shown on the map as a cut-out of a mask with
a crosshair at its center. Move, zoom, rotate or tilt the map, then press **Done** to return to the
dialog with that area (or **Cancel** / Esc to keep the previous one). The dialog closes with the × button, the Esc key or a click outside of it.

**Save**: browsers which support the
[File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker)
(Chrome, Edge) ask where to save the file when **Save** is pressed. Other browsers save it to their
download folder. Nothing is saved when `download: false` is set.

### Customizing the look

The dialog is plain HTML styled only by `mapbox-gl-export.css`. Every element has a class prefixed with
`mapboxgl-export-`, and the theme is driven by CSS custom properties:

```css
.mapboxgl-export-dialog {
	--gl-export-accent: #0f766e;
	--gl-export-radius: 4px;
	--gl-export-font: 'Inter', sans-serif;
}
```

Icons are from [Lucide](https://lucide.dev/icons/). Each is wrapped in
`<span class="mapboxgl-export-icon mapboxgl-export-icon--{key}">`, so it can be replaced from CSS:

```css
.mapboxgl-export-icon--pageSize svg {
	display: none;
}
.mapboxgl-export-icon--pageSize {
	background-color: currentColor;
	mask: url('my-icon.svg') center / contain no-repeat;
}
```

See the comment at the top of [`src/scss/mapbox-gl-export.scss`](./src/scss/mapbox-gl-export.scss) for every variable and icon key.

## Vector export (experimental)

By default `svg` and `pdf` wrap an image of the map. Turn on **Export as vector** in the export dialog,
which is shown while SVG or PDF is selected, or set `svgVectorOptions: { enabled: true }` to try exporting
the fill, line and point layers as real vector paths:

```ts
map.addControl(new MapboxExportControl({ Format: Format.SVG, svgVectorOptions: { enabled: true } }));
```

Layers which have no vector counterpart (raster, hillshade, heatmap, fill-extrusion, ...) are
embedded as images at their place in the layer order, and so are labels unless **Export labels as vector**
is turned on (`labels: 'vector'`), which writes them as editable text at an approximated position. The map is exported as an image as before when
it cannot be converted at all. See [maplibre2svg](../maplibre2svg) for what is supported.

## WebP

Select **WEBP** (`Format.WEBP`, saved as `.webp`) to export the map as a WebP image, which is usually much
smaller than the PNG. Browsers which cannot encode WebP, such as Safari, export a PNG instead with a warning
in the console.

```ts
map.addControl(new MapboxExportControl({ Format: Format.WEBP }));
```

## GeoPDF

PDF files are georeferenced as a GeoPDF (the geospatial extension of ISO 32000), so that GIS
software such as QGIS (GDAL) or Avenza Maps places them on the map. The four corners of the page
are written in latitude and longitude with the Web Mercator (EPSG:3857) projection the map is drawn in,
so a rotated map is georeferenced correctly too. It is skipped when the map is pitched, has terrain or
uses the globe projection. Set `geoPdf: false` to export a plain PDF:

```ts
map.addControl(new MapboxExportControl({ Format: Format.PDF, geoPdf: false }));
```

## GeoTIFF

Select **GEOTIFF** (`Format.GEOTIFF`, saved as `.tif`) to export the map as a GeoTIFF, which GIS software
such as QGIS (GDAL) places on the map. The image is the same as the PNG, including the scale bar, north icon
and attribution, and is written with the Web Mercator (EPSG:3857) projection the map is drawn in, so a rotated
map is georeferenced correctly too. The attribution of the map is also written into the `Artist` tag. A plain
TIFF is exported when the map is pitched, has terrain or uses the globe projection.

```ts
map.addControl(new MapboxExportControl({ Format: Format.GEOTIFF }));
```
