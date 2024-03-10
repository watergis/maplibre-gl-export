# malibre-gl-export

![License](https://img.shields.io/github/license/watergis/maplibre-gl-export)
![build](https://github.com/watergis/maplibre-gl-export/workflows/build/badge.svg)
[![Netlify Status](https://api.netlify.com/api/v1/badges/2ca781c3-2680-4c17-9219-4992c1f2a44e/deploy-status)](https://app.netlify.com/sites/maplibre-gl-export/deploys)
![GitHub repo size](https://img.shields.io/github/repo-size/watergis/maplibre-gl-export)

This monorepo manages the source code and demo page for `@watergis/maplibre-gl-export` and `@watergis/mapbox-gl-export`.

## Repositories

| repository | version | description | changelog |
|---|---|---|---|
|[@watergis/maplibre-gl-export](./packages/maplibre-gl-export/)| [![version](https://img.shields.io/npm/v/@watergis/mapbox-gl-export.svg)](https://www.npmjs.com/package/@watergis/mapbox-gl-export) | To manage maplibre export plugin source code|[CHANGELOG](./packages/maplibre-gl-export/CHANGELOG.md)|
|[@watergis/mapbox-gl-export](./packages/mapbox-gl-export/)| [![version](https://img.shields.io/npm/v/@watergis/maplibre-gl-export.svg)](https://www.npmjs.com/package/@watergis/maplibre-gl-export) | To manage mapbox export plugin source code|[CHANGELOG](./packages/mapbox-gl-export/CHANGELOG.md)|
|[demo](./sites/demo/)| - | Demo website code for maplibre/mapbox export plugins |-|

## Usage of the plugin

See README.md for [maplibre-gl-export](./packages/maplibre-gl-export) or [mapbox-gl-export](./packages/mapbox-gl-export)

## How to release

It uses changeset to release. Please create release notes by the following command. Changeset will release package once the PR is merged into main branch.

```zsh
pnpm changeset
```

## Contribution

See [CONTRIBUTING](./.github/CONTRIBUTING.md)
