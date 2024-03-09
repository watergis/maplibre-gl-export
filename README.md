# malibre-gl-export

[![Netlify Status](https://api.netlify.com/api/v1/badges/2ca781c3-2680-4c17-9219-4992c1f2a44e/deploy-status)](https://app.netlify.com/sites/maplibre-gl-export/deploys)

This monorepo manages the source code and demo page for `@watergis/maplibre-gl-export` and `@watergis/mapbox-gl-export`.

## Repositories

| repository | description | changelog |
|---|---|---|
|[@watergis/maplibre-gl-export](./packages/maplibre-gl-export/)| To manage maplibre export plugin source code|[CHANGELOG](./packages/maplibre-gl-export/CHANGELOG.md)|
|[@watergis/mapbox-gl-export](./packages/mapbox-gl-export/)| To manage mapbox export plugin source code|[CHANGELOG](./packages/mapbox-gl-export/CHANGELOG.md)|
|[maplibre-gl-export.water-gis.com](./sites/maplibre-gl-export.water-gis.com/)| Demo website code for maplibre/mapbox export plugins |-|

## Usage of the plugin

See README.md for [maplibre-gl-export](./packages/maplibre-gl-export) or [mapbox-gl-export](./packages/mapbox-gl-export)

## How to release

It uses changeset to release. Please create release notes by the following command. Changeset will release package once the PR is merged into main branch.

```zsh
pnpm changeset
```

## Contribution

See [CONTRIBUTING](./.github/CONTRIBUTING.md)
