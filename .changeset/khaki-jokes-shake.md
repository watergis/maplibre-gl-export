---
"@watergis/maplibre-gl-export": minor
"@watergis/mapbox-gl-export": minor
---

feat: make the generated image available to the application instead of only downloading it.

`MapGenerator` is now exported from both packages and exposes `toCanvas()` and `toBlob()`, so the image can be generated without the export panel and without saving a file:

```ts
import { MapGenerator, Format, Size } from '@watergis/maplibre-gl-export';

// composed canvas of the map, at the requested page size and DPI
const canvas = await new MapGenerator(map, { size: Size.A4, dpi: 300 }).toCanvas();

// or the image in the configured format. png, jpg, pdf and svg are supported
const blob = await new MapGenerator(map, { size: Size.A4, format: Format.PDF }).toBlob();
setPdfUrl(URL.createObjectURL(blob));
```

The generator and the export control also accept a `download` option and an `onExport` callback, so the image produced by the generate button of the panel can be picked up by the application. `download` defaults to `true`, so the file keeps being saved unless it is turned off:

```ts
map.addControl(
  new MaplibreExportControl({
    PageSize: Size.A4,
    Format: Format.PNG,
    // do not save the image as a file, only hand it over to `onExport`
    download: false,
    onExport: ({ canvas, blob, fileName, format }) => {
      console.log(`generated ${fileName} (${format}), ${blob.size} bytes`);
      setImageUrl(URL.createObjectURL(blob));
    }
  }),
  'top-right'
);
```
