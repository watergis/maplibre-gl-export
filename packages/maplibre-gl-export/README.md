# maplibre-gl-export

[![version](https://img.shields.io/npm/v/@watergis/maplibre-gl-export.svg)](https://www.npmjs.com/package/@watergis/maplibre-gl-export)

This module adds control which can export PDF and images. It was forked from [mapbox-gl-export](https://github.com/watergis/mapbox-gl-export).

This module is using source code of [mpetroff/print-maps](https://github.com/mpetroff/print-maps). I just adopted this library to normal Mapbox GL Plugin. Thanks so much to develop this library!

## Demo & usage

See the [documentation](https://maplibre-gl-export.water-gis.com/). The demos use
MapLibre GL JS v6 by default, with a separate v5 example.

## MapLibre GL JS compatibility

Supported peer range: `^5.21.1 || >=6.0.0-0 <7.0.0`.

```sh
pnpm add @watergis/maplibre-gl-export maplibre-gl
```

- **v5:** ESM or UMD.
- **v6:** ESM only; bundlers require one-time worker setup. See the
  [v6 migration guide](https://github.com/maplibre/maplibre-gl-js/blob/main/docs/guides/v5-to-v6-migration-guide.md).

CDN examples: [stable default](./index_cdn.html), [v5](./index_cdn_v5.html), and
[v6](./index_cdn_v6.html).
