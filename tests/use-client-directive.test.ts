import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT_DIR = resolve(__dirname, '..');
const DIST_DIR = resolve(ROOT_DIR, 'dist');
const SRC_DIR = resolve(ROOT_DIR, 'src');

describe('"use client" directive', () => {
  describe('source files', () => {
    it('should have "use client" directive at the top of src/index.ts', () => {
      const indexPath = resolve(SRC_DIR, 'index.ts');
      const content = readFileSync(indexPath, 'utf-8');
      const firstLine = content.split('\n')[0].trim();

      // Source uses single quotes per project style
      expect(firstLine).toBe("'use client';");
    });
  });

  describe('build output', () => {
    beforeAll(() => {
      // Verify dist directory exists (tests should run after build)
      if (!existsSync(DIST_DIR)) {
        throw new Error(
          'dist directory not found. Run "npm run build" before running tests.',
        );
      }
    });

    it('should have "use client" directive at the top of dist/index.esm.js', () => {
      const esmPath = resolve(DIST_DIR, 'index.esm.js');

      if (!existsSync(esmPath)) {
        throw new Error(`${esmPath} not found. Run "npm run build" first.`);
      }

      const content = readFileSync(esmPath, 'utf-8');

      // Check that the file starts with the "use client" directive
      // (minified output may not have newlines)
      expect(content.startsWith('"use client";')).toBe(true);
    });

    it('should have "use client" directive at the top of dist/index.js (CJS)', () => {
      const cjsPath = resolve(DIST_DIR, 'index.js');

      if (!existsSync(cjsPath)) {
        throw new Error(`${cjsPath} not found. Run "npm run build" first.`);
      }

      const content = readFileSync(cjsPath, 'utf-8');

      // Check that the file starts with the "use client" directive
      // (minified output may not have newlines)
      expect(content.startsWith('"use client";')).toBe(true);
    });

    it('should NOT have "use client" in webcomponent bundle (not needed for IIFE)', () => {
      const webComponentPath = resolve(DIST_DIR, 'webcomponent.js');

      if (!existsSync(webComponentPath)) {
        throw new Error(
          `${webComponentPath} not found. Run "npm run build" first.`,
        );
      }

      const content = readFileSync(webComponentPath, 'utf-8');

      // Web component bundle should NOT have "use client" since it's an IIFE
      // that includes React and is meant for vanilla HTML usage
      expect(content.startsWith('"use client";')).toBe(false);
    });
  });
});
