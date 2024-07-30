# @watergis/maplibre-gl-export

## 3.8.2

### Patch Changes

- b7a4bff: Fix an error: Style is not done loading

## 3.8.1

### Patch Changes

- 26a1d32: fix: It has a breaking change on attribution options. `options.attributionStyle` is changed to `options.attributionOptions.style`. add `visibility` and `position` option into `options.attributionOptions`. Due to technical issue, only `top-right` or `bottom-right` position are supported currently.

## 3.8.0

### Minor Changes

- a66f15b: feat: export north icon on the map. North icon image, size, visibility and position can be customized through `northIconOptions`. The below is default settings for north icon.

  ```js
  {
      "image": `<svg width="800px" height="800px" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--gis" preserveAspectRatio="xMidYMid meet"><path d="M47.655 1.634l-35 95c-.828 2.24 1.659 4.255 3.68 2.98l33.667-21.228l33.666 21.228c2.02 1.271 4.503-.74 3.678-2.98l-35-95C51.907.514 51.163.006 50 .008c-1.163.001-1.99.65-2.345 1.626zm-.155 14.88v57.54L19.89 91.461z" fill="none" stroke="white" stroke-width="1.5"/><path d="M47.655 1.634l-35 95c-.828 2.24 1.659 4.255 3.68 2.98l33.667-21.228l33.666 21.228c2.02 1.271 4.503-.74 3.678-2.98l-35-95C51.907.514 51.163.006 50 .008c-1.163.001-1.99.65-2.345 1.626zm-.155 14.88v57.54L19.89 91.461z" fill="#000000" fill-rule="evenodd"></path></svg>`,
      "imageName": "gl-export-north-icon",
      "imageSizeFraction": 0.05,
      "visibility": "visible",
      "position": "top-right"
  }
  ```

## 3.7.1

### Patch Changes

- 6dd9820: fix: add check for actual image data before calling addImage by @jmbarbier

## 3.7.0

### Minor Changes

- bf0467a: feat: add Catalan language contributed by @lstiz

## 3.6.0

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

## 3.5.0

### Minor Changes

- 85470db: feat: added Portuguese language which the translation was contributed by @leoneljdias via https://github.com/watergis/maplibre-gl-export/pull/133

### Patch Changes

- 1a9b3d8: fix: use local language name for Translation object
- 64d39b0: refactor: export AvailableLanguages as an array from mapblire-gl-export
- a86c079: fix: add LanguageCode in Translation interface

## 3.4.1

### Patch Changes

- 4b16e32: fix: enabled addImage code for maplibre-gl-export again
- 352c82d: refactor: removed unused variable from MapGeneratorBase class

## 3.4.0

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

## 3.3.0

### Minor Changes

- 1c9327a: feat: apply maplibre terrain mode for image exporting if it is used.

## 3.2.4

### Patch Changes

- eba7503: refactor: Extends MaplibreExportControl to MapboxExportContorl to use the same logic and UI. Fixed type error for languages
- eba7503: fix: fixed class name to get page size

## 3.2.3

### Patch Changes

- 93722dd: refactor: export interfaces from maplibre-gl-export

## 3.2.2

### Patch Changes

- 7d86d84: - feat: add languageName prop in Translation interface
  - fix: remove PrintableArea when the control is removed from map instance.

## 3.2.1

### Patch Changes

- f7b81d9: refactor: Use Translations, PrintableAreaManager and CrosshairManager from maplibre-gl-export at mapbox-gl-export

## 3.2.0

### Minor Changes

- a03a84b: feat: upgrade maplibre dependencies to v4

### Patch Changes

- a03a84b: feat: added `LETTER` page size (migrated it from `mapbox-gl-export`)

## 3.1.1

### Patch Changes

- fdddb32: fix: Fix export icon color inconsistency fixed by @sudolev

## 3.1.0

### Minor Changes

- eb5270d: feat: add Japanese language (ja)
- eb5270d: feat: bring new translations (Vietnam, Ukranian, Chinese simplified and Chinese traditional) from mapbox-gl-export

## 3.0.1

### Patch Changes

- fc5adb2: fix: fixed the bug of export PDF of A3 size spondered by @PivnoyBaronDmitry through the PR of https://github.com/watergis/mapbox-gl-export/pull/48

## 3.0.0

### Major Changes

- 47c956a: [**breaking change**] feat: upgraded maplibre-gl-js to v3

## 2.0.1

### Patch Changes

- 83c85bc: fix: added exports for maplibre-gl-export.css

## 2.0.0

### Major Changes

- f5cc0c5: This release has breaking changes. It changes as follows.

  - migrated webpack to vite
  - migrated yarn to pnpm
  - introduced monorepo by using pnpm workspaces
  - introduced changeset for releasing package
  - CDN path will be changed

### Patch Changes

- 1f8fd87: fixed release CI and bug of demo page settings
- 45fdc37: fix: fixed repository name at if statement in release CI
