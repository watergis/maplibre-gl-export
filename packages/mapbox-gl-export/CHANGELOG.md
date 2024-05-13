# @watergis/mapbox-gl-export

## 3.4.0

### Minor Changes

- bf0467a: feat: add Catalan language contributed by @lstiz

## 3.3.0

### Minor Changes

- 406978e: feat: add attribution to the bottom-right of an exported image. `attributionStyle` property is added into options. The default attribution style is

  ```js
  {
    attributionStyle: {
      textSize: 16,
      textHaloColor: '#FFFFFF',
      textHaloWidth: 0.8,
      textColor: '#000000',
      fallbackTextFont: ['Open Sans Regular']
    }
  }
  ```

  This plugin will try to get attribution from HTMLElement by class name of 'maplibregl-ctrl-attrib-inner' or 'mapboxgl-ctrl-attrib-inner' first. If elements are not available, it will try to make attribution text from 'attribution' property of map style source.

  If `glyphs` property is not set to map style, attribution will not be added since the plugin will add attribution as a symbol layer of maplibre/mapbox.

  In terms of text-font, the plugin will use the same font of the first layer which has text-font property in its layer style. If a text-font is not available from style object, fallbackTextFont will be used instead.

## 3.2.0

### Minor Changes

- 85470db: feat: added Portuguese language which the translation was contributed by @leoneljdias via https://github.com/watergis/maplibre-gl-export/pull/133

### Patch Changes

- 1a9b3d8: fix: use local language name for Translation object
- 64d39b0: refactor: export AvailableLanguages as an array from mapblire-gl-export
- a86c079: fix: add LanguageCode in Translation interface

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
