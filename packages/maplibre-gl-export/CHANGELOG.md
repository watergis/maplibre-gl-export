# @watergis/maplibre-gl-export

## 5.0.0

### Major Changes

- be90fa4: feat: draw the attribution, north icon and a new scale bar onto the exported image with a composed 2D canvas instead of adding them as symbol layers.

  The exported map canvas is now composed onto a 2D canvas before being saved, and the overlays are drawn on top of it. A `ScaleControl` and an `AttributionControl` are added to the hidden map used for rendering, and their elements are rasterized and drawn onto the exported image, keeping maplibre's native styling. This removes the limitations of the previous symbol layer approach:

  - the attribution no longer requires the `glyphs` property in the style
  - the attribution and the north icon are no longer hidden at zoom levels below 2
  - the attribution can now be placed in any of the four corners
  - a scale bar is exported for the first time, and can be toggled from the export panel together with the north icon

  ### Usage

  The scale bar and north icon can be toggled from the export panel, and both overlays can be configured through `MaplibreExportControl`:

  ```ts
  import {
  	MaplibreExportControl,
  	Size,
  	PageOrientation,
  	Format,
  	DPI
  } from '@watergis/maplibre-gl-export';

  const exportControl = new MaplibreExportControl({
  	PageSize: Size.A3,
  	PageOrientation: PageOrientation.Landscape,
  	Format: Format.PNG,
  	DPI: DPI[300],
  	// attribution: rasterized from maplibre's own AttributionControl (keeps native styling)
  	attributionOptions: {
  		visibility: 'visible',
  		position: 'bottom-right', // any of the four corners
  		margin: 10, // distance from the map edge at 96 DPI
  		compact: false,
  		customAttribution: '© My Company'
  	},
  	// scale bar: exported for the first time
  	scalebarOptions: {
  		visibility: 'visible',
  		position: 'bottom-left',
  		margin: 10,
  		maxWidth: 100,
  		unit: 'metric' // 'metric' | 'imperial' | 'nautical'
  	},
  	// north icon
  	northIconOptions: {
  		visibility: 'visible',
  		position: 'top-right',
  		margin: 10
  	}
  });

  map.addControl(exportControl, 'top-right');
  ```

  ### Breaking changes

  `attributionOptions.style` (`textSize`, `textColor`, `textHaloColor`, `textHaloWidth`, `fallbackTextFont`) has been removed. The attribution is now rasterized from maplibre's own `AttributionControl` element, so it keeps the library's native styling and there is nothing to configure. `attributionOptions` now accepts `compact` and `customAttribution` of maplibre's `AttributionControlOptions`, plus `visibility`, `position` (any of the four corners) and `margin`.

### Minor Changes

- b7b4173: feat: add custom to PageSize menu to allow users to change height and width freely,
- 1d9d37d: feat: make the generated image available to the application instead of only downloading it.

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

- c31e758: feat: allow developer-defined page sizes in the `AllowedSizes` option.

  `AllowedSizes` used to accept only the names of the built-in paper presets, so aspect ratios that are not paper formats (16:9, 3:2, 1:1, ...) could not be offered in the page size dropdown. An entry can now also be a `{ name, size }` pair, and preset names and custom sizes can be mixed in the same list.

  ```ts
  const exportControl = new MaplibreExportControl({
  	AllowedSizes: ['A4', { name: '16:9', size: [320, 180] }, { name: 'Square', size: [200, 200] }]
  });
  ```

  `size` is `[width, height]` in mm in landscape order, exactly like the presets, so the Page Orientation dropdown swaps it when `portrait` is selected. Invalid entries are ignored instead of breaking the panel. Passing an array of preset names keeps working unchanged.

### Patch Changes

- b7b4173: fix: fixed form layout collapse, make it look better.
- 01a8ecf: fix: remove the duplicated `text-align` declaration from the export list button style. `text-align: right` was overridden by `text-align: center` on the next line, so only the dead declaration is dropped and the rendering is unchanged.
- 2e65aca: fix: keep the metadata of the style images when they are copied to the map used for exporting. `pixelRatio`, `sdf`, `stretchX/Y` and `content` were dropped, so high resolution icons were exported at their full bitmap size and `icon-color` was no longer applied to SDF icons. The mapbox plugin additionally failed to copy any image at all, because mapbox-gl v3 keeps them in a nested `Map` instead of a plain object.

## 4.2.0

### Minor Changes

- ae0a9f0: Support MapLibre GL JS v5 and v6, with v6 as the stable default.

### Patch Changes

- 8e94e1f: chore: update dependencies

## 4.1.2

### Patch Changes

- 68e4abc: chore: updated dependencies

## 4.1.1

### Patch Changes

- 3cc9a19: chore: update jspdf to 4.0.0

## 4.1.0

### Minor Changes

- a84469e: feat: add Russian translation

### Patch Changes

- 2689f24: chore: updated dependencies in package.json

## 4.0.1

### Patch Changes

- 513f0e5: chore: updated dependencies

## 4.0.0

### Major Changes

- 3862737: chore: upgrade maplibre-gl dependency from v4 to v5.

## 3.8.5

### Patch Changes

- 7728399: chore: updated dependencies

## 3.8.4

### Patch Changes

- c3c5f8c: fix: repalced js-loading-overlay to pure css to show loader.

## 3.8.3

### Patch Changes

- 5a45f61: chore: updated all dependencies of mapbox-gl-export and maplibre-gl-export (particularly for eslint v9)

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
- 64d39b0: refactor: export AvailableLanguages as an array from maplibre-gl-export
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
