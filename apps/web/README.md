This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## End-to-end tests

Playwright tests in `e2e/` run the production build against a local Supabase stack in Docker, so they never touch the hosted project. AI explanations are mocked in the browser.

Before you start, install Docker. Then, from `apps/web`:

1. Start local Supabase (Postgres and Auth only): `pnpm e2e:db`. The first run pulls the Docker images.
2. Install the test browser once: `pnpm exec playwright install chromium`.
3. Run the tests: `pnpm e2e`.

`pnpm e2e` applies the Prisma migrations, recreates the `e2e@docuvocab.test` user and its seeded document, builds the app with the local Supabase URL and keys, and serves it on port 3300.

- The `extension` project also builds the extension with `wxt build --mode e2e` (into `apps/extension/.output/chrome-mv3-e2e`, pointed at port 3300) and loads it into Playwright's Chromium. Each test signs the extension in with a fresh Supabase session. In that build only, the extension UI uses an open shadow root so tests can query it.
- The e2e build overwrites `.next`. Run `pnpm build` again before you use `pnpm start` against the hosted project.
- To stop Supabase, run `pnpm e2e:db:stop`.
- CI runs the same suite in the `e2e` job on every pull request to `main`. When it fails, download the `playwright-report` artifact from the run to see traces and screenshots.
