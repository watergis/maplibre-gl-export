---
"@watergis/mapbox-gl-export": minor
---

feat: add the GeoTIFF format (`Format.GEOTIFF`, saved as `.tif`), which can be opened on the map in GIS software such as QGIS (GDAL).

The image is the same as the PNG, including the scale bar, north icon and attribution, and it is georeferenced with the Web Mercator (EPSG:3857) projection the map is drawn in, so a rotated map is georeferenced correctly too. The attribution of the map is also written into the `Artist` tag. It is compressed with Deflate, and a plain TIFF is exported, with a warning in the console, when the map is pitched, has terrain or uses the globe projection.

```ts
map.addControl(
  new MapboxExportControl({ Format: Format.GEOTIFF }),
  "top-right",
);
```

The exported file can be checked with GDAL:

```bash
gdalinfo map.tif
```
