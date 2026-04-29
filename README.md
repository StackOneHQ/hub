# StackOne HUB

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D22.14.0-brightgreen.svg)

StackOne HUB is a React-based integration component library that provides a web component wrapper for seamless integration into any web application. It enables developers to easily embed StackOne's integrations hub.

## 📋 Table of Contents

- [StackOne HUB](#stackone-hub)
  - [📋 Table of Contents](#-table-of-contents)
  - [🚀 Quick Start](#-quick-start)
  - [📦 Installation](#-installation)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
  - [🛠️ Development](#️-development)
    - [Environment Setup](#environment-setup)
    - [Next.js SSR Sandbox](#nextjs-ssr-sandbox)
  - [🏗️ Build](#️-build)
    - [Build Output](#build-output)
  - [📖 Usage](#-usage)
    - [🌐 Web Component Integration](#-web-component-integration)
    - [⚛️ React Component Integration](#️-react-component-integration)
    - [▲ Next.js (App Router) Integration](#-nextjs-app-router-integration)
    - [⚠️ "Invalid hook call" — duplicate React](#️-invalid-hook-call--duplicate-react)
    - [💻 Local Development Usage](#-local-development-usage)
      - [Web Component (Local)](#web-component-local)
      - [React Component (Local)](#react-component-local)
  - [🔧 Environment Variables](#-environment-variables)
    - [Example `.env` file:](#example-env-file)
  - [🤝 Contributing](#-contributing)
    - [Getting Started](#getting-started)
  - [📄 License](#-license)

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd hub
npm install
npm run build

# Start development
npm run dev
```

## 📦 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v22.14.0 or higher
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## 🛠️ Development

### Environment Setup

1. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables** (see [Environment Variables](#-environment-variables) section)

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The Vite dev server starts at [http://localhost:3001](http://localhost:3001).

### Next.js SSR Sandbox

A second sandbox lives in `dev/nextjs/` and runs the hub inside a Next.js 15 + React 19 App Router app. Use it to verify server-side rendering behaviour.

From the repo root:

```bash
# First time (builds the hub and installs sandbox deps)
npm run dev:nextjs:setup

# Subsequent runs
npm run dev:nextjs
```

The Next.js sandbox runs at [http://localhost:3002](http://localhost:3002). Set `STACKONE_API_KEY` in `dev/nextjs/.env` (see `dev/nextjs/.env.example`) to have the page fetch a connect-session token server-side, or paste one into the input on the page.

After editing hub source, rerun `npm run build` from the repo root — the sandbox is linked via `file:../..` so it picks up the new `dist/` automatically.

## 🏗️ Build

To build the project for production:

```bash
npm run build
```

### Build Output

The build generates multiple bundles in the `dist/` directory:

| File | Description | Use Case |
|------|-------------|----------|
| `dist/index.esm.js` | ES module bundle (with `'use client'` banner) | Modern React apps, Next.js, Vite |
| `dist/index.js` | CommonJS module (with `'use client'` banner) | Node.js / legacy environments |
| `dist/index.d.ts` | TypeScript declarations | Type-checking |
| `dist/webcomponent.js` | Web component bundle (IIFE, React inlined) | Vanilla HTML/JS integration |

## 📖 Usage

### 🌐 Web Component Integration

For vanilla HTML/JavaScript applications:

```html
<!DOCTYPE html>
<html>
<head>
    <title>StackOne HUB Integration</title>
</head>
<body>
    <script src="<TBD>/webcomponent.js"></script>
    <stackone-hub token="..."></stackone-hub>
</body>
</html>
```

### ⚛️ React Component Integration

For React applications (CSR — Vite, CRA, etc.):

```tsx
import { StackOneHub } from "@stackone/hub";

function App() {
  return (
    <div className="app">
      <h1>My Application</h1>
      <StackOneHub token={token} />
    </div>
  );
}

export default App;
```

`StackOneHub` is a client-side component — it ships with a `'use client'` directive and is safe to import directly in any framework that supports server-side rendering.

### ▲ Next.js (App Router) Integration

`StackOneHub` is annotated with `'use client'` so you can import it directly from any Server Component. The token can be created server-side (recommended — keeps your API key off the client and avoids the CORS-protected `/connect_sessions` endpoint), and passed as a prop to a small Client Component that renders the hub.

**Important:** Add `suppressHydrationWarning` to the `<html>` tag in your root layout. The hub applies its theme CSS custom properties to `document.documentElement` after hydration, which would otherwise trigger a hydration warning on the `<html>` element (the warning only suppresses the `<html>` tag itself, not its children):

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

**`app/page.tsx`** (Server Component):

```tsx
import HubWrapper from "./HubWrapper";

export default async function Page() {
  const res = await fetch("https://api.stackone.com/connect_sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(process.env.STACKONE_API_KEY!).toString("base64")}`,
    },
    body: JSON.stringify({
      origin_owner_id: "your_customer_id",
      origin_owner_name: "Your Customer",
      origin_username: "your_username",
    }),
    cache: "no-store",
  });
  const { token } = await res.json();

  return <HubWrapper token={token} />;
}
```

**`app/HubWrapper.tsx`** (Client Component):

```tsx
"use client";

import { StackOneHub } from "@stackone/hub";

export default function HubWrapper({ token }: { token: string }) {
  return (
    <StackOneHub
      token={token}
      mode="integration-picker"
      onSuccess={(account) => console.log("connected", account)}
    />
  );
}
```

If you prefer to opt the hub out of SSR entirely (Pages Router, or to skip the server pre-render):

```tsx
import dynamic from "next/dynamic";

const StackOneHub = dynamic(
  () => import("@stackone/hub").then((m) => m.StackOneHub),
  { ssr: false },
);
```

A working example lives in [`dev/nextjs/`](./dev/nextjs).

### ⚠️ "Invalid hook call" — duplicate React

`@stackone/hub` declares `react` and `react-dom` as **peer dependencies** and the bundle imports them at runtime — your app's copy must be the only copy that ends up loaded. In a standard `npm install` your bundler will hoist React and you won't see this. But the following setups can leave you with **two copies of React** and trip the "Invalid hook call" error:

- **Monorepos** (npm workspaces, Yarn workspaces, Turborepo) where multiple packages each have their own `node_modules/react`.
- **pnpm** with strict isolation — a transitive copy can shadow the root copy.
- **`file:` / `link:` dependencies** pointing at a directory that has its own `node_modules/react` (this is what bit our local Vite sandbox).

Fixes by bundler:

**Vite** — add `resolve.dedupe` to your config:

```ts
// vite.config.ts
export default defineConfig({
    resolve: {
        dedupe: ['react', 'react-dom', 'react-hook-form'],
    },
});
```

**Webpack / Next.js** — usually handled automatically. If not, alias `react` and `react-dom` to a single absolute path:

```js
// next.config.mjs
import path from "node:path";
export default {
    webpack: (config) => {
        config.resolve.alias["react"] = path.resolve("./node_modules/react");
        config.resolve.alias["react-dom"] = path.resolve("./node_modules/react-dom");
        return config;
    },
};
```

**pnpm** — set `public-hoist-pattern[]=react*` in `.npmrc`, or `shamefully-hoist=true`.

To diagnose, run `npm ls react` (or `pnpm why react`) at your app's root — if you see more than one entry resolved to a different path, that's the cause.

### 💻 Local Development Usage

#### Web Component (Local)
```html
<script src="dist/webcomponent.js"></script>
<stackone-hub token="..."></stackone-hub>
```

#### React Component (Local)
```tsx
import { StackOneHub } from "../dist/index.esm.js";

function App() {
  return <StackOneHub token={token} />;
}
```

## 🔧 Environment Variables

Create a `.env` file in the `dev` directory with the following variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `STACKONE_API_KEY` | Your StackOne API key | ✅ |
| `ORIGIN_OWNER_ID` | The origin owner identifier | ✅ |
| `ORIGIN_OWNER_NAME` | Display name for the owner | ✅ |
| `ORIGIN_USERNAME` | Username for authentication | ✅ |
| `API_URL` | Backend API endpoint URL | ✅ |
| `DASHBOARD_URL` | Dashboard application URL | ✅ |

### Example `.env` file:
```bash
STACKONE_API_KEY=your_api_key_here
ORIGIN_OWNER_ID=your_owner_id
ORIGIN_OWNER_NAME=Your Company Name
ORIGIN_USERNAME=your_username
API_URL=https://api.stackone.com
DASHBOARD_URL=https://dashboard.stackone.com
```

## 🤝 Contributing

We welcome contributions and feedback! Please keep in mind:

- 📋 **No formal process yet**: Contribution guidelines are still being established
- 💬 **Communication is key**: Please open an issue before submitting large changes

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---
