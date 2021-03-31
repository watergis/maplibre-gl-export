# maplibre-gl-export
![](https://github.com/watergis/maplibre-gl-export/workflows/build/badge.svg)
![](https://github.com/watergis/maplibre-gl-export/workflows/deploy%20gh-pages/badge.svg)
![](https://github.com/watergis/maplibre-gl-export/workflows/Release%20Draft/badge.svg)
![](https://github.com/watergis/maplibre-gl-export/workflows/Node.js%20Package/badge.svg)
![GitHub](https://img.shields.io/github/license/watergis/maplibre-gl-export)

This module adds control which can export PDF and images. It was forked from [mapbox-gl-export](https://github.com/watergis/mapbox-gl-export).

This module is using source code of [mpetroff/print-maps](https://github.com/mpetroff/print-maps). I just adopted this library to normal Mapbox GL Plugin. Thanks so much to develop this library!

## Installation:

```bash
yarn add @watergis/maplibre-gl-export --save
```

## Demo:

See [demo](https://watergis.github.io/maplibre-gl-export/#12/-1.08551/35.87063).

![demo.gif](./demo.gif)

## Usage:

```ts
import { MaplibreExportControl, Size, PageOrientation, Format, DPI} from "@watergis/maplibre-gl-export";
import '@watergis/maplibre-gl-export/css/styles.css';
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
    Crosshair: true
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

## Development:

```
yarn run lint # check styling of source code
yarn run lint:fix # fix styling by eslint
yarn run dev
```

open [http://localhost:8080](http://localhost:8080).

If there are any changes on source code, it will be reflected automatically.

## Build package:

```
yarn run build
```

The modules will be generated under `dist` folder.

## Deploy to Github pages

```
yarn run deploy
```

It will deploy files under `example` folder to gh-pages.

## How to release

```zsh
vi package.json
# update version in package.json
git add package.json
git commit -m "v1.X.X"
git push origin main
git tag v1.X.X main
git push --tag
# release CI will create draft release in Github pages, then publish it if it is ready.
# publish CI will deploy npmjs and Github Packages.
```

## Contribution

This Maplibre GL Export Control is still under development. so most welcome any feedbacks and pull request to this repository.
