# Build Doc Dictionary (Firefox) from source

Requirements: Node.js 22 or later, and pnpm 11.7.0 (`corepack enable` picks it up from the root `package.json`).

From the root of the sources archive:

```sh
pnpm install --frozen-lockfile --filter @docuvocab/extension...
pnpm --filter @docuvocab/extension exec wxt build -b firefox
```

The build lands in `apps/extension/.output/firefox-mv2/` and matches the submitted add-on. The extension imports TypeScript source from `packages/shared`, which has no separate build step.
