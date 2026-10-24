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

## Production build

```bash
npm ci
npm run build
npm start
```

The production build and server were verified locally with Node.js 24.3.0 and Next.js 16.4.0. To use another local port, run `npm run start -- --hostname 127.0.0.1 --port 3005`.

`next.config.ts` uses Turbopack's `workerThreads` plugin runtime so CSS loaders do not require the child-process socket pool that caused `binding to a port: Operation not permitted (os error 1)` on this host. The existing Tailwind loader and ordinary `next build` command are preserved.

This option is experimental. The installed Next.js 16.4.0 guide documents a fallback to child processes on Node.js 24.13.1 and newer because of a worker teardown issue; that fallback can expose the original restriction again. When changing Node or Next versions, check `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopackPluginRuntimeStrategy.md` and rerun the production build. Do not use `forceWorkerThreads` to bypass the compatibility protection.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
