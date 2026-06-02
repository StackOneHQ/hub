import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import dts from "rollup-plugin-dts";
import external from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";

// `@stackone/expressions` pulls in the full `@stackone/utils` barrel, whose node
// AND edge builds top-level `import { Saml20 } from "saml"`. `saml` drags in
// `xml-crypto`/`xml-encryption`, leaking `crypto`/`fs`/`path` into the browser
// bundle. The integration picker only uses `evaluate`, never SAML assertion
// generation, so we resolve `saml` to a stub. The stub throws on use so an
// unexpected SAML code path fails with an actionable error rather than a cryptic
// `Saml20 is not a constructor`.
const SAML_STUB =
  "export class Saml20 {\n" +
  "  constructor() {\n" +
  "    throw new Error('@stackone/hub: `saml` is stubbed out of the browser bundle — SAML assertion generation is not available client-side.');\n" +
  "  }\n" +
  "}\n";
const stubSaml = {
  name: "stub-saml",
  resolveId(source) {
    return source === "saml" ? "\0saml-stub" : null;
  },
  load(id) {
    return id === "\0saml-stub" ? SAML_STUB : null;
  },
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
    ],
    plugins: [
      del({ targets: "dist/*" }),
      stubSaml,
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
      replace({
        preventAssignment: true,
        "process.env.NODE_ENV": JSON.stringify("production"),
      }),
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
      globals: { crypto: "globalThis.crypto" },
    },
    external: ["crypto"],
    plugins: [
      stubSaml,
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
      replace({
        preventAssignment: true,
        "process.env.NODE_ENV": JSON.stringify("production"),
      }),
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
