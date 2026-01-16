# StackOne HUB

> 👉 **BETA SOFTWARE** 
> This project is currently in **beta stage**. It is evolving quickly, and new versions may include breaking changes.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-beta-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D22.14.0-brightgreen.svg)

StackOne HUB is a React-based integration component library that provides a web component wrapper for seamless integration into any web application. It enables developers to easily embed StackOne's integrations hub.

## 📋 Table of Contents

- [StackOne HUB](#stackone-hub)
  - [📋 Table of Contents](#-table-of-contents)
  - [⚠️ Beta Notice](#️-beta-notice)
  - [🚀 Quick Start](#-quick-start)
  - [📦 Installation](#-installation)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
  - [🛠️ Development](#️-development)
    - [Environment Setup](#environment-setup)
  - [🏗️ Build](#️-build)
    - [Build Output](#build-output)
  - [📖 Usage](#-usage)
    - [🌐 Web Component Integration](#-web-component-integration)
    - [⚛️ React Component Integration](#️-react-component-integration)
    - [Next.js App Router](#nextjs-app-router)
    - [Next.js Pages Router](#nextjs-pages-router)
    - [💻 Local Development Usage](#-local-development-usage)
      - [Web Component (Local)](#web-component-local)
      - [React Component (Local)](#react-component-local)
  - [🔧 Environment Variables](#-environment-variables)
    - [Example `.env` file:](#example-env-file)
  - [🤝 Contributing](#-contributing)
    - [Getting Started](#getting-started)
  - [📄 License](#-license)

## ⚠️ Beta Notice

**This software is in active development and should be considered beta quality.** 

- 🚧 **Breaking changes** may occur in any release
- 📚 **Documentation** is updated regularly
- 🔄 **APIs are subject to change** without prior notice

Please report issues and provide feedback to help us improve!

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

The development server will start at [http://localhost:3000](http://localhost:3000) (default port).

## 🏗️ Build

To build the project for production:

```bash
npm run build
```

### Build Output

The build generates multiple bundles in the `dist/` directory:

| File | Description | Use Case |
|------|-------------|----------|
| `StackOneHub.esm.js` | ES module bundle | Modern React applications |
| `StackOneHub.cjs.js` | CommonJS module | Node.js/legacy environments |
| `StackOneHub.web.js` | Web component bundle | Vanilla HTML/JS integration |

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
    <script src="<TBD>/StackOneHub.web.js"></script>
    <my-component></my-component>
</body>
</html>
```

### ⚛️ React Component Integration

For React applications:

```tsx
import { StackOneHub } from "@stackone/hub";

function App() {
  return (
    <div className="app">
      <h1>My Application</h1>
      <StackOneHub
        mode="integration-picker"
        token="your-session-token"
      />
    </div>
  );
}

export default App;
```

### Next.js App Router

The library includes the `"use client"` directive, so it works out-of-the-box with Next.js 13+ App Router:

```tsx
// app/integrations/page.tsx
import { StackOneHub } from "@stackone/hub";

export default function IntegrationsPage() {
  return (
    <main>
      <h1>Connect Your Integrations</h1>
      <StackOneHub
        mode="integration-picker"
        token="your-session-token"
      />
    </main>
  );
}
```

**With dynamic token fetching:**

```tsx
// app/integrations/page.tsx
import { HubContainer } from "./hub-container";

// Server Component - fetch token on server
async function getSessionToken() {
  const response = await fetch("https://api.stackone.com/connect/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${process.env.STACKONE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origin_owner_id: "your-owner-id",
      origin_owner_name: "Your Company",
    }),
  });
  const data = await response.json();
  return data.token;
}

export default async function IntegrationsPage() {
  const token = await getSessionToken();

  return (
    <main>
      <h1>Connect Your Integrations</h1>
      <HubContainer token={token} />
    </main>
  );
}

// app/integrations/hub-container.tsx
"use client";

import { StackOneHub } from "@stackone/hub";

interface HubContainerProps {
  token: string;
}

export function HubContainer({ token }: HubContainerProps) {
  return (
    <StackOneHub
      mode="integration-picker"
      token={token}
    />
  );
}
```

### Next.js Pages Router

For the Pages Router, simply import and use the component:

```tsx
// pages/integrations.tsx
import { StackOneHub } from "@stackone/hub";

export default function IntegrationsPage() {
  return (
    <div>
      <h1>Connect Your Integrations</h1>
      <StackOneHub
        mode="integration-picker"
        token="your-session-token"
      />
    </div>
  );
}
```

### 💻 Local Development Usage

#### Web Component (Local)
```html
<script src="dist/StackOneHub.web.js"></script>
<my-component></my-component>
```

#### React Component (Local)
```tsx
import StackOneHub from "dist/StackOneHub.esm";

function App() {
  return <StackOneHub />;
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

Since this project is in beta, we welcome contributions and feedback! However, please keep in mind:

- 🔄 **Frequent changes**: The codebase may change rapidly
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
