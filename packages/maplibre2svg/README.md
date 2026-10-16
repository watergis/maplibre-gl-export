# maplibre2svg

![GitHub](https://img.shields.io/github/license/watergis/maplibre-gl-export)

Convert a rendered [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) map into an SVG whose layers are real vectors. It is what the experimental `svgVectorOptions` option of [`@watergis/maplibre-gl-export`](../maplibre-gl-export) and [`@watergis/mapbox-gl-export`](../mapbox-gl-export) uses.

> This package is not published to npm. It is bundled into the export plugins, and versioned here to keep a changelog of the conversion.
>
> This package is experimental. The output may differ from the map, and the API may change in a minor release.

## Usage

```ts
import { maplibre2svg, svgToString } from '@watergis/maplibre2svg';

map.once('idle', async () => {
	const svg = await maplibre2svg(map, { width: 297, height: 210, unit: 'mm' });
	const source = svgToString(svg);
});
```

The features are read from the map as it is rendered at the moment, so the map has to be idle.

### Options

| Option        | Default  | Description                                                                                                                                       |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`       |          | Physical width of the SVG document in `unit`. The size of the map in CSS pixels is used when it is omitted.                                         |
| `height`      |          | Physical height of the SVG document in `unit`.                                                                                                      |
| `unit`        | `mm`     | `mm`, `in` or `px`.                                                                                                                                 |
| `labels`      | `raster` | How symbol layers are written: `raster` lays them over the vectors as one transparent image, `vector` writes them as editable `<text>` elements.     |
| `idleTimeout` | `5000`   | How long to wait for the map to become idle while it renders the layers which are embedded as images, in ms.                                        |

## How the style is converted

Every layer of the style is written, in its place in the layer order.

| Layer type                                                        | Output                    | Properties written as vectors                                                                                                   |
| ----------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `background`                                                      | vector                    | color, opacity, pattern                                                                                                         |
| `fill`                                                            | vector                    | color, opacity, outline-color, translate, antialias, pattern                                                                    |
| `line`                                                            | vector                    | color, opacity, width, dasharray, cap, join, miter-limit, translate, offset, gap-width                                          |
| `circle`                                                          | vector                    | radius, color, opacity, stroke-color, stroke-width, stroke-opacity, translate                                                   |
| `symbol`                                                          | image, or text and icons  | text-field, font, size, color, halo, anchor, offset, rotate, transform, letter-spacing, icon-image, size, rotate, anchor, offset |
| `raster`, `hillshade`, `heatmap`, `fill-extrusion`, `color-relief` | image                     |                                                                                                                                 |

A layer is embedded as an image as well when it uses a property which has no vector counterpart: `line-gradient`, `line-pattern`, a `line-blur` or `circle-blur` other than 0, or a `background` whose properties are expressions.

Data-driven and zoom-dependent properties are supported: the values are the ones the map evaluated for each feature.

### Limitations

- A map with terrain or in a projection other than mercator cannot be converted. `maplibre2svg` throws an `UnsupportedMapError` in that case.
- Features are split at tile boundaries, as they are in the vector tiles. Each part is clipped to its tile.
- The phase of dashed lines differs from the map.
- With `labels: 'vector'` the position of a label is derived from the geometry of its feature, because the map does not expose where it placed it: point labels are anchored at the feature, and labels along a line are centered on the part of the line in each tile. The text is drawn in a font of the viewer, as the map only has its glyphs as bitmaps.

### Mapbox GL JS

The conversion is written for MapLibre GL JS: the layer types and the names of their properties are taken from its style specification. `@watergis/mapbox-gl-export` passes a Mapbox GL JS map to it as it is, which converts what both libraries have in common. Patterns and icons are embedded as images because Mapbox GL JS does not expose the images of the style, and styles which import other styles, such as Mapbox Standard, are exported as an image altogether.

## Development

```bash
pnpm test
pnpm build
```
