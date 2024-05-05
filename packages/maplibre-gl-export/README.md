# maplibre-gl-export

[![version](https://img.shields.io/npm/v/@watergis/maplibre-gl-export.svg)](https://www.npmjs.com/package/@watergis/maplibre-gl-export)

This module adds control which can export PDF and images. It was forked from [mapbox-gl-export](https://github.com/watergis/mapbox-gl-export).

This module is using source code of [mpetroff/print-maps](https://github.com/mpetroff/print-maps). I just adopted this library to normal Mapbox GL Plugin. Thanks so much to develop this library!

## Installation:

```bash
yarn add @watergis/maplibre-gl-export --save
```

## Use CDN

import JS and CSS from CDN.

- from unpkg.com

```html
<link href="https://www.unpkg.com/@watergis/maplibre-gl-export@3.3.0/dist/maplibre-gl-export.css" rel="stylesheet" />
<script src="https://www.unpkg.com/@watergis/maplibre-gl-export@3.3.0/dist/maplibre-gl-export.umd.js"></script>
```

- from jsdelivr

```html
<link href="https://cdn.jsdelivr.net/npm/@watergis/maplibre-gl-export@3.3.0/dist/maplibre-gl-export.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/@watergis/maplibre-gl-export@3.3.0/dist/maplibre-gl-export.umd.js"></script>
```

See the sample code [here](./index_cdn.html).

Alternatively, you can use `latest` tag for CDN instead of specific version (But any breaking changes may be in the future).

## Demo:

See [demo](https://maplibre-gl-export.water-gis.com/).

![demo.gif](./demo.gif)

## Usage:

```ts
import { MaplibreExportControl, Size, PageOrientation, Format, DPI} from "@watergis/maplibre-gl-export";
import '@watergis/maplibre-gl-export/dist/maplibre-gl-export.css';
import { Map} from 'maplibre-gl';

const map = new Map();
// create control with default options
map.addControl(new MaplibreExportControl(), 'top-right');
// create control with specified options
map.addControl(new MaplibreExportControl({
    PageSize: Size.A3,
    PageOrientation: PageOrientation.Portrait,
    Format: Format.PNG,
    DPI: DPI[96],
    Crosshair: true,
    PrintableArea: true
}), 'top-right');
```

### Options
You can specify default option as follows.

- PageSize
  - You can select from `A2` to `A6` or `B2` to `B6`
  - default page size is `A4`
- PageOrientation
  - You can select `landscape` or `portrait`
  - default is `landscape`
- Format
  - You can select it from `jpg`, `png`, `svg` and `pdf`
  - default is `PDF`
- DPI
  - You can select it from `72`, `96`, `200`, `300` and `400`.
  - default is `300`
- Crosshair
  - Display crosshair on the map. it helps to adjust the map center before printing.
  - accepts `true` and `false` value
  - default is `false`
- PritableArea
  - Display printable area on the map it helps to adjust pritable area before printing.
  - accepts `true` and `false` value
  - default is `false`
- Local
  - default `en` for english
  - `de` german
  - `fr` french
  - `fi` finnish
  - `sv` swedish
  - `es` spanish
  - `vi` Vietnam
  - `uk` Ukranian
  - `zhHans` Chinese Simplified
  - `zhHant` Chinese Traditional
  - `ja` Japanese
  - `pt` Portuguese
- AllowedSizes
  - list of allowed page sizes for export
  - available values `'LETTER'`, `'A2'`, `'A3'`, `'A4'`, `'A5'`, `'A6'`, `'B2'`, `'B3'`, `'B4'`, `'B5'`, `'B6'`
  - default: all sizes `['LETTER','A2','A3','A4','A5','A6','B2','B3','B4','B5','B6']`
- Filename
  - file name template, file part
  - default `map` for i.e `map.pdf`
- markerCirclePaint: The plugin will convert marker SVG to circle layer to be exported.
  - Circle paint property setting. As default, the following paint setting will be applied

```json
{
  "circle-radius": 8,
  "circle-color": "red",
  "circle-stroke-width": 1,
  "circle-stroke-color": "black"
}
```

## Attribution

When you use exported map, please includes attribution as follows.

If you can include HTML, use this code snippet that includes links to Mapbox & OpenStreetMap:
```html
© NARWASSCO, Ltd. © <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>Powered by the United Nations Vector Tile Toolkit
```

For print output or if you can’t include links, use this text-only attribution:
```
© NARWASSCO, Ltd. ©Mapbox ©OpenStreetMap contributors, Powered by the United Nations Vector Tile Toolkit
```

`© NARWASSCO, Ltd.` is default example of map data by `Narok Water and Sewerage Services Co., Ltd.`, Kenya. If you don't use current map, you don't need to use this attribution.

Also, default example is using base map by United Nation Vector Tile Toolkit. That is why `Powered by the United Nations Vector Tile Toolkit` is included in above.

## Development

```
pnpm lint
pnpm format
pnpm dev
```

open [http://localhost:5173](http://localhost:5173).

If there are any changes on source code, it will be reflected automatically.

## Build package

```
pnpm build
```

The modules will be generated under `dist` folder.
