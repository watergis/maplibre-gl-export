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
