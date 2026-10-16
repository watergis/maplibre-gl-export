---
"@watergis/maplibre-gl-export": minor
---

feat: georeference the exported PDF as a GeoPDF, so that it can be opened on the map in GIS software such as QGIS (GDAL) or Avenza Maps.

The four corners of the page are written in latitude and longitude with the Web Mercator (EPSG:3857) projection the map is drawn in, following the geospatial extension of ISO 32000. It works for both the image PDF and the vector PDF (`svgVectorOptions.enabled`), and a rotated map is georeferenced correctly too. It is skipped, with a warning in the console, when the map is pitched, has terrain or uses the globe projection.

It is enabled by default. Set `geoPdf: false` to export a plain PDF:

```ts
import { MaplibreExportControl, Size, PageOrientation, Format, DPI } from '@watergis/maplibre-gl-export';

map.addControl(
	new MaplibreExportControl({
		PageSize: Size.A4,
		PageOrientation: PageOrientation.Landscape,
		Format: Format.PDF,
		DPI: DPI[300],
		geoPdf: true // default. set false to export a plain PDF
	}),
	'top-right'
);
```

The exported file can be checked with GDAL, which reports the Pseudo-Mercator coordinate system and the corner coordinates of the map:

```bash
gdalinfo map.pdf
```
