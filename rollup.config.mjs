import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import dts from "rollup-plugin-dts";
import external from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";

export default [
  // Main React Component Bundle
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.esm.js",
        format: "esm",
      },
      {
        file: "dist/index.js",
        format: "cjs",
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
      resolve({
        preferBuiltins: false,
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
      terser(),
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
    },
    plugins: [
      resolve({
        preferBuiltins: false,
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
      terser(),
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
