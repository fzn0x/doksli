# Contributing to doksli

Thanks for helping out. A few things keep the project consistent.

## Setup

```sh
pnpm install
pnpm dev
```

Use Node.js 20.19 or newer and pnpm 10 (`corepack enable` installs the version pinned in `package.json`). In VS Code, install the recommended Biome extension so formatting matches CI.

## Before you open a pull request

```sh
pnpm format   # Biome: apply lint fixes and formatting
pnpm build    # TypeScript check plus production build
```

CI runs `biome ci` and `pnpm build` on every push and pull request.

## Ground rules

- **Real tweets only.** doksli must never offer a way to edit tweet text, authors, dates or metrics. Presentation options (styles, themes, canvas, layout) are welcome.
- **No invented numbers.** If X doesn't return a value (reposts, views), don't display or estimate it.
- **Preview equals export.** Anything inside `.canvas` ends up in the PNG. Preview-only overlays go outside it or carry `data-preview-only`.
- **Accessible controls.** Choices are native radio groups and switches under their custom skins. Keep keyboard and screen-reader behaviour intact.

## Reporting bugs

Include the tweet link (if it's public), your browser and OS, and what you expected to see. For layout bugs, attach the exported PNG and a screenshot of the preview.
