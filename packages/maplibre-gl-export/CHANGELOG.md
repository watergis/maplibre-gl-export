# @watergis/maplibre-gl-export

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
