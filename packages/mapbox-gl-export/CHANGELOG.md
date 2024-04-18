# @watergis/mapbox-gl-export

## 3.1.0

### Minor Changes

- 7639be0: feat: export markers as circle layer if they are added to map object. `markerCirclePaint` option is added to allow changing default circle style for marker. The default marker style is:

  ```json
  {
    "circle-radius": 8,
    "circle-color": "red",
    "circle-stroke-width": 1,
    "circle-stroke-color": "black"
  }
  ```

## 3.0.4

### Patch Changes

- eba7503: refactor: Extends MaplibreExportControl to MapboxExportContorl to use the same logic and UI. Fixed type error for languages

## 3.0.3

### Patch Changes

- 93722dd: refactor: import interfaces from maplibre-gl-export

## 3.0.2

### Patch Changes

- 7d86d84: - feat: add languageName prop in Translation interface
  - fix: remove PrintableArea when the control is removed from map instance.

## 3.0.1

### Patch Changes

- f7b81d9: refactor: Use Translations, PrintableAreaManager and CrosshairManager from maplibre-gl-export at mapbox-gl-export

## 3.0.0

### Major Changes

- a03a84b: This release has breaking changes.

  - merged [mapbox-gl-export](https://github.com/watergis/mapbox-gl-export) repository to `maplibre-gl-export`.
  - added Spanish language and Japanese language from `maplibre-gl-export`
  - added `Filename` option from `maplibre-gl-export` to allow to change default file name from `map`.
  - added `AllowedSizes` option from `maplibre-gl-export` to allow to set available file sizes.
  - the URL of CDN script and css were changed. Use the below URLs for CDN.

  ```html
  <link
    href="https://www.unpkg.com/@watergis/mapbox-gl-export@latest/dist/mapbox-gl-export.css"
    rel="stylesheet"
  />
  <script src="https://www.unpkg.com/@watergis/mapbox-gl-export@latest/dist/mapbox-gl-export.umd.js"></script>
  ```
