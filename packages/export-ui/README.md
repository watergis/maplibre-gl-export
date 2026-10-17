# @watergis/export-ui

Internal UI of [maplibre-gl-export](../maplibre-gl-export) and [mapbox-gl-export](../mapbox-gl-export): the export dialog and the tools shown on the map while the exported area is adjusted. It is written in Svelte and **not published to npm**; the plugins bundle it into their JavaScript, CSS and type declarations.

The core logic (rendering and exporting the map) stays in `maplibre-gl-export`. This package only receives it as callbacks (`renderPreview`, `adjustArea`, `onSave`).

The package was created with `sv create --template library`, and Storybook with `storybook init`.

## Layout

- `src/lib/components` – the form components (`Button.svelte`, `Slider.svelte`, ...), each with its story (`Button.stories.svelte`)
- `src/lib/dialog` – `ExportDialog.svelte`, `PreviewPane.svelte` and `SettingsPanel.svelte`, with their stories
- `src/lib/map` – the tools shown on the map while the area is adjusted (`AreaAdjuster`, `AdjustBar.svelte`, crosshair, printable area)
- `src/lib/export-dialog.ts` – `ExportDialog`, which mounts the dialog for the plugins
- `src/lib/interfaces`, `src/lib/local`, `src/lib/utils` – types, translations and helpers shared with the plugins
- `src/lib/theme.css` – the `--gl-export-*` custom properties
- `src/stories` – helpers of the stories: the MapLibre map of the ExportDialog, PreviewPane and AreaAdjuster stories, and stand-ins for the rendering and export of the plugins

## Styles

Every component keeps its styles in its own `<style>`, scoped by Svelte. The elements also carry `gl-export-*` classes (the same for MapLibre and Mapbox), and the theme is driven by the `--gl-export-*` custom properties defined in `src/lib/theme.css`, which the dialog and the map toolbar import.

When a plugin is built, Vite bundles the styles of the components into its single CSS file (`maplibre-gl-export.css`, which `mapbox-gl-export.css` copies).

## Development

```bash
pnpm --filter @watergis/export-ui storybook
```

```bash
pnpm --filter @watergis/export-ui test
```

`test` runs the unit tests and renders every story in Chromium; install it once with `pnpm --filter @watergis/export-ui exec playwright install chromium`.

```bash
pnpm --filter @watergis/export-ui build
```

`build` packages `src/lib` into `dist`, which the plugins import. Build it before running the plugins in development.
