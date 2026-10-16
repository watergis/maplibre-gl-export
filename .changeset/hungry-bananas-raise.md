---
"@watergis/maplibre-gl-export": minor
---

feat: add the WebP format (`Format.WEBP`, saved as `.webp`), which is usually much smaller than the PNG.

The image is the same as the PNG, including the scale bar, north icon and attribution, and it is encoded with the browser's WebP encoder, so no extra library is needed. A PNG is exported instead, with a warning in the console, when the browser cannot encode WebP, such as Safari.

```ts
import { MaplibreExportControl, Size, PageOrientation, Format, DPI } from '@watergis/maplibre-gl-export';

map.addControl(
	new MaplibreExportControl({
		PageSize: Size.A4,
		PageOrientation: PageOrientation.Landscape,
		Format: Format.WEBP,
		DPI: DPI[300]
	}),
	'top-right'
);
```
