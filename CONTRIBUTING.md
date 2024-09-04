# Contributing Guidelines

This document contains a set of guidelines to help developers during the contribution process.

## Development

### Download and install dependencies

```shell
git clone git@github.com:watergis/maplibre-gl-export.git
cd maplibre-gl-export
pnpm i
```

When you download the repository first time, please also install `lefthook` by the following command.

```shell
pnpm lefthook install
```

### Run locally

- maplibre-gl-export

```shell
cd packages/maplibre-gl-export
pnpm dev
```

- mapbox-gl-export

```shell
cd packages/mapbox-gl-export
pnpm dev
```

Note. Most of common features are imported from `maplibre-gl-export` plugin

- Demo documentation

```shell
# build maplibre-gl-export and mapbox-gl-export at the root folder of the repository
pnpm build
cd sites/demo
pnpm dev
```

### Build packages

Both packages and documentation are built by the below command.

```shell
pnpm build
```

## Release packages

It uses changeset to release. Please create release notes by the following command. Changeset will release package once the PR is merged into main branch.

```zsh
pnpm changeset
```

## How to make a pull request

1. [Fork the repo](https://help.github.com/articles/fork-a-repo) and create a branch for your new feature or bug fix.

2. Install NPM packages by `pnpm install && pnpm lefthook install`.

3. Run the plugins to check all of plugin's features work well. Run: `pnpm dev`

4. Make sure you submit a change specific to exactly one issue. If you have ideas for multiple changes please create separate pull requests.

5. Make prettier pass. Run: `pnpm format`

6. Make eslint pass. Run: `pnpm lint`

7. Add a changeset file by following [this](#release)

8. Commit local changes in git. Run: `git add . && git commit -m "precise commit message"

9. Push local branch to your forked remote repository.

10. Push to your fork and [submit a pull request](https://help.github.com/articles/using-pull-requests). A button should appear on your fork its github page afterwards.
