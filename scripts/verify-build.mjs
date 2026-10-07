import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const HEADER = 'x-hub-version';
const TOKEN = '__HUB_VERSION__';

const quoted = (literal) => new RegExp(`["']${literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`);
const BANNER = /^["']use client["'];/;

const bundles = ['dist/index.esm.js', 'dist/index.js', 'dist/webcomponent.js'];
const withBanner = new Set(['dist/index.esm.js', 'dist/index.js']);

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
}

if (failures.length > 0) {
    console.error('Build verification failed:');
    for (const failure of failures) {
        console.error(`  - ${failure}`);
    }
    process.exit(1);
}

console.log(`Build verified: all bundles stamped with ${version}.`);
