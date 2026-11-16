import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename } from 'node:path';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const HEADER = 'x-hub-version';
const TOKEN = '__HUB_VERSION__';

const quoted = (literal) => new RegExp(`["']${literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`);
const BANNER = /^["']use client["'];/;

const bundles = ['dist/index.esm.js', 'dist/index.js', 'dist/webcomponent.js'];
const withBanner = new Set(['dist/index.esm.js', 'dist/index.js']);
// The IIFE is served on its own, so a font it names as a file 404s beside it.
const selfContained = new Set(['dist/webcomponent.js']);
const FONT_FILE = /[\w.-]+\.(?:woff2?|ttf|otf)(?![\w.-])/g;
// Rollup's IIFE stand-in for import.meta.url: anything resolved against it lands beside the script.
const scriptRelative = (file) =>
    new RegExp(
        `new URL\\(["']${basename(file).replaceAll('.', '\\.')}["'],\\s*document\\.baseURI\\)`,
    );

const failures = [];

for (const file of bundles) {
    let source;

    try {
        source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    } catch {
        failures.push(`${file}: missing — run \`npm run build\` first`);
        continue;
    }

    if (source.includes(TOKEN)) {
        failures.push(`${file}: contains an unreplaced ${TOKEN}`);
    }

    if (!quoted(HEADER).test(source)) {
        failures.push(`${file}: does not send the ${HEADER} header`);
    }

    if (!quoted(version).test(source)) {
        failures.push(`${file}: not stamped with version ${version}`);
    }

    if (withBanner.has(file) && !BANNER.test(source)) {
        failures.push(`${file}: lost its "use client" banner`);
    }

    if (selfContained.has(file)) {
        const fontFiles = new Set(source.match(FONT_FILE));
        if (fontFiles.size > 0) {
            failures.push(`${file}: loads ${[...fontFiles].join(', ')} as files`);
        }
        if (scriptRelative(file).test(source)) {
            failures.push(`${file}: uses import.meta.url, which points at the script's own URL`);
        }
    }
}

if (failures.length > 0) {
    console.error('Build verification failed:');
    for (const failure of failures) {
        console.error(`  - ${failure}`);
    }
    process.exit(1);
}

console.log(`Build verified: all bundles stamped with ${version}.`);
