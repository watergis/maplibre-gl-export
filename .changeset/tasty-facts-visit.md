---
"@watergis/mapbox-gl-export": minor
---

feat: SVG and PDF can now be exported as real vectors instead of an image of the map (experimental).

Tick **Export as vector** in the export panel, which is shown while SVG or PDF is selected, or enable it through the new `svgVectorOptions`:

```ts
new MapboxExportControl({
	Format: Format.SVG,
	svgVectorOptions: {
		enabled: true, // "Export as vector" checkbox. default is false
		labels: 'raster' // 'vector' ticks "Export labels as vector". default is 'raster'
	}
});
```

- `enabled`: draws fill, line and point layers as vector paths. Layers which have no vector counterpart (raster, hillshade, heatmap, fill-extrusion, ...) are still embedded as images.
- `labels`: `raster` lays the labels over the vectors as an image, so that they look as on the map. `vector` writes them as editable text.
- Patterns and icons are embedded as images, because Mapbox GL JS does not expose the images of the style.

Mind the following when `labels` is `vector`:

- The position of a label is approximated, because the map does not expose where it placed it. Point labels are anchored at their feature and labels along a line are centered on it, so labels may overlap each other and are not repeated along a line.
- The text is drawn in a font of the viewer rather than the one of the map, which only has its glyphs as bitmaps. Its look and width differ from the map.
- In PDF the text uses the standard PDF fonts, which only cover Latin characters. Keep `raster` for labels in other scripts such as Japanese.
- Symbol layers which have an icon stay an image, because Mapbox GL JS does not expose the images of the style.

The map is exported as an image as before when it cannot be converted (terrain, globe projection, styles which import other styles such as Mapbox Standard).
