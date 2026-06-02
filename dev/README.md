# Hub dev sandboxes

Each folder is a self-contained dev app that consumes the hub via `"@stackone/hub": "file:../.."`. Run any one of them from the **hub repo root** using the matching `dev:*` npm script.

| Folder | What it exercises | Stack | Port | Run from hub root |
|---|---|---|---|---|
| `vite/` | React export (`<StackOneHub>`) on a Vite SPA | React 18 + Vite | 3001 | `npm run dev` |
| `vite-react19/` | React export (`<StackOneHub>`) on a Vite SPA, React 19 | React 19 + Vite | 3015 | `npm run dev:react19` |
| `nextjs/` | React export (`<StackOneHub>`) under Next.js SSR | React 19 + Next.js 15 | 3002 | `npm run dev:nextjs` |
| `vanilla/` | `<stackone-hub>` custom element via `<script src>` | Plain HTML + `serve` | 3010 | `npm run dev:vanilla` |
| `vue/` | `<stackone-hub>` in a Vue template | Vue 3.5 + Vite 5 | 3011 | `npm run dev:vue` |
| `svelte/` | `<stackone-hub>` in a Svelte component | Svelte 5 + Vite 6 | 3012 | `npm run dev:svelte` |
| `react/` | `<stackone-hub>` mounted from React (not the React export) | React 19 + Vite 5 | 3013 | `npm run dev:react-wc` |
| `rsbuild/` | React export (`<StackOneHub>`) bundled by Rspack — catches Node built-in leaks | React 19 + rsbuild | 3014 | `npm run dev:rsbuild` |
| `angular/` | `<stackone-hub>` in an Angular template | Angular 18 + Angular CLI | 4201 | `npm run dev:angular` |

## First-time setup

Each sandbox needs the hub's `dist/` built and its own dependencies installed. The `:setup` scripts handle both:

```bash
npm run dev:vue:setup     # or dev:vanilla:setup, dev:svelte:setup, etc.
```

After that, just `npm run dev:<name>` to start the dev server.

## Iterating on the hub

After editing `../src/`, run `npm run build` from the hub root. The sandboxes consume the freshly built `node_modules/@stackone/hub/dist/`; Vite/Angular dev servers pick up the new bundle on the next request — no reinstall needed.

## Token UX (common across sandboxes)

Each cross-framework sandbox renders a paste input for a connect-session token. The token is persisted to `localStorage` under `stackone-hub-token`.

For auto-fetch, copy `dev/.env.example` to `dev/.env` and set `VITE_STACKONE_API_KEY`. This single file is shared by the three Vite sandboxes (`vue`, `svelte`, `react`) — each `vite.config.ts` points at it with `envDir: '..'`. On first load with an empty `localStorage`, the sandbox mints a token via `POST {API_URL}/connect_sessions` and prefills the input.

The Angular sandbox is the one exception: Angular CLI doesn't read `.env` files, so set its values in `angular/src/environments/environment.ts` instead.

> ⚠️ **Localhost only.** The auto-fetch path POSTs to `connect_sessions` from the browser, which only works against a local API. Pointing `VITE_API_URL` at `api.stackone.com`, `api.stackone-dev.com`, or `api.stackone-exp.com` will fail (CORS) — the sandbox detects this and logs a warning instead. For dev/exp/prod, mint a token out-of-band (curl/server/Postman) and paste it into the token input.

The vanilla sandbox is paste-only (no build step to inject env vars).

## What each new sandbox demonstrates

All five cross-framework sandboxes exercise the same checklist:

1. Render `<stackone-hub>` with the standard attributes (`token`, `base-url`, `mode`, `height`, `theme`).
2. Subscribe to the `success` and `close` CustomEvents and append entries to an on-page event log.
3. Theme toggle that flips between `light` and `dark`.

## Troubleshooting

- **"Failed to resolve component: stackone-hub" (Vue)** — `vite.config.ts` is missing the `isCustomElement` block.
- **"'stackone-hub' is not a known element" (Angular)** — the component is missing `CUSTOM_ELEMENTS_SCHEMA` in its `schemas`.
- **`dist/webcomponent.js` not found** — you forgot to `npm run build` in the hub root, or the `:setup` script for that sandbox.
- **"Invalid hook call — duplicate React" in `react/`** — the React sandbox uses the web-component path (which bundles its own React), so this would only happen if you swap to the `StackOneHub` React export. See the main hub README for the duplicate-React fix.
