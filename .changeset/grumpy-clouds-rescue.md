---
"@watergis/maplibre-gl-export": minor
"@watergis/mapbox-gl-export": minor
---

feat: export markers as circle layer if they are added to map object. `markerCirclePaint` option is added to allow changing default circle style for marker. The default marker style is:

```json
{
  "circle-radius": 8,
  "circle-color": "red",
  "circle-stroke-width": 1,
  "circle-stroke-color": "black"
}
```
