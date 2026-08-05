import { createRequire } from "node:module";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import dts from "rollup-plugin-dts";
import external from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";

const pkg = createRequire(import.meta.url)("./package.json");

const replaceValues = {
  preventAssignment: true,
  "process.env.NODE_ENV": JSON.stringify("production"),
  __HUB_VERSION__: JSON.stringify(pkg.version),
};

export default [
  // Main React Component Bundle
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.esm.js",
        format: "esm",
        banner: "'use client';",
      },
      {
        file: "dist/index.js",
        format: "cjs",
        banner: "'use client';",
      },
    ],
    external: [
      "react",
      "react-dom",
      "react-hook-form",
      /^react\/.*/,
      /^react-dom\/.*/,
      /^react-hook-form\/.*/,
      // Left to the consumer's bundler so they ship one copy, not two.
      "@stackone/malachite",
      /^@stackone\/malachite\/.*/,
    ],
    plugins: [
      del({ targets: "dist/*" }),
      external(),
      resolve({
        preferBuiltins: false,
        browser: true,
      }),
      commonjs(),
      typescript({ 
        tsconfig: "./tsconfig.json",
        declaration: false,
      }),
      postcss({
        extract: false,
        inject: true,
      }),
      replace(replaceValues),
      terser({
        compress: { directives: false },
      }),
    ],
  },

  // Web Component Bundle (bundled React)
  {
    input: "src/WebComponentWrapper.tsx",
    output: {
      file: "dist/webcomponent.js",
      format: "iife",
      name: "StackOneHubWebComponent",
      sourcemap: true,
      // malachite lazy-loads CodeBlock; an IIFE has to be a single file.
      inlineDynamicImports: true,
    },
    plugins: [
      resolve({
        preferBuiltins: false,
        browser: true,
        exportConditions: ["browser", "module", "import", "default"],
      }),
      commonjs(),
      typescript({ 
        tsconfig: "./tsconfig.json",
        declaration: false,
      }),
      postcss({
        extract: false,
        inject: true,
      }),
      replace(replaceValues),
      terser({
        compress: { directives: false },
      }),
    ],
  },

  // TypeScript declarations
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
];
