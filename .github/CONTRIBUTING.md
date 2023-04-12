Submit a new issue only if you are sure it is a missing feature or a bug.

## A quick guide for pull request:

1. [Fork the repo](https://help.github.com/articles/fork-a-repo) and create a branch for your new feature or bug fix.

2. Install NPM packages by `pnpm install && pnpm lefthook install`.

3. Run the plugins to check all of plugin's features work well. Run: `pnpm dev`

4. Make sure you submit a change specific to exactly one issue. If you have ideas for multiple changes please create separate pull requests.

5. Make eslint pass. Run: `pnpm lint`

6. Push to your fork and [submit a pull request](https://help.github.com/articles/using-pull-requests). A button should
appear on your fork its github page afterwards.
