---
"@watergis/mapbox-gl-export": major
---

This release has breaking changes.

- merged [mapbox-gl-export](https://github.com/watergis/mapbox-gl-export) repository to `maplibre-gl-export`.
- added Spanish language and Japanese language from `maplibre-gl-export`
- added `Filename` option from `maplibre-gl-export` to allow to change default file name from `map`.
- added `AllowedSizes` option from `maplibre-gl-export` to allow to set available file sizes.
- the URL of CDN script and css were changed. Use the below URLs for CDN.

```html
<link href="https://www.unpkg.com/@watergis/mapbox-gl-export@latest/dist/mapbox-gl-export.css" rel="stylesheet" />
<script src="https://www.unpkg.com/@watergis/mapbox-gl-export@latest/dist/maplibre-gl-export.umd.js"></script>
```