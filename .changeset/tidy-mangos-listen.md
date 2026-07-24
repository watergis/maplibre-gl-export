---
'@watergis/maplibre-gl-export': minor
'@watergis/mapbox-gl-export': minor
---

feat: allow developer-defined page sizes in the `AllowedSizes` option.

`AllowedSizes` used to accept only the names of the built-in paper presets, so aspect ratios that are not paper formats (16:9, 3:2, 1:1, ...) could not be offered in the page size dropdown. An entry can now also be a `{ name, size }` pair, and preset names and custom sizes can be mixed in the same list.

```ts
const exportControl = new MaplibreExportControl({
  AllowedSizes: [
    'A4',
    { name: '16:9', size: [320, 180] },
    { name: 'Square', size: [200, 200] }
  ]
});
```

`size` is `[width, height]` in mm in landscape order, exactly like the presets, so the Page Orientation dropdown swaps it when `portrait` is selected. Invalid entries are ignored instead of breaking the panel. Passing an array of preset names keeps working unchanged.
