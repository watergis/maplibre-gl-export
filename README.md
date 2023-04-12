# malibre-gl-export

This monorepo manages the source code and demo page for `@watergis/maplibre-gl-export`.

## Repositories

| repository | description |
|---|---|
|[@watergis/maplibre-gl-export](./packages/maplibre-gl-export/)|The main repository to manage plugin source code|
|[maplibre-gl-export.water-gis.com](./sites/maplibre-gl-export.water-gis.com/)|The repository manages demo website|

## Usage of the plugin

See [README](./packages/maplibre-gl-export)

## How to release

It uses changeset to release. Please create release notes by the following command. Changeset will release package once the PR is merged into main branch.

```zsh
pnpm changeset
```

## Contribution

See [CONTRIBUTING](./.github/CONTRIBUTING.md)
