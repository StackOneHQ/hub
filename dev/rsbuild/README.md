# rsbuild sandbox

Consumes the React `<StackOneHub>` export and bundles it with
[rsbuild](https://rsbuild.dev) (Rspack) for a browser target.

Rspack is stricter than Vite: it does **not** silently polyfill Node core modules for the
web. So if anything in the bundle reaches for `crypto`, `fs`, `path`, or `vm`, the build
fails here with a clear `Module not found` error instead of shipping a broken bundle to
consumers. That makes this sandbox a good guard that the published hub stays browser-safe.

## Run

```bash
npm run dev:rsbuild:setup   # build the hub, then npm install in dev/rsbuild
npm run dev:rsbuild         # dev server on http://localhost:3014
```

To check the bundle directly:

```bash
cd dev/rsbuild && npm run build
```

A clean build means no Node built-ins leaked into `dist/`. If the build fails on one,
a transitive dependency has started reaching for the Node platform — trace it with
`npm ls <module>` and either resolve it to a browser entry or stub it in the hub's
`rollup.config.mjs`.
