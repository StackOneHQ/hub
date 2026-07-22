/**
 * Asserts the local FORMAT_PATTERNS copy against the canonical format accept/reject
 * vectors — copied from `@stackone/core` `FORMAT_PATTERN_TEST_VECTORS` (connect repo,
 * `packages/core/src/connector/specs/formatPatterns.vectors.ts`).
 *
 * The canonical registry and this local copy must pass exactly these vectors, so
 * `stackone validate` and this hub can never disagree about what a format accepts.
 * Keep both the registry copy (utils/zodSchema.ts) and these vectors in sync when a
 * format changes. Run via `npm test`.
 */
import { FORMAT_PATTERNS } from '../src/modules/integration-picker/utils/zodSchema';

const FORMAT_PATTERN_TEST_VECTORS: Record<string, { accepts: string[]; rejects: string[] }> = {
    email: {
        accepts: ['john@example.com', 'a.b+tag@sub.domain.co'],
        rejects: ['not-an-email', 'a b@example.com', '@example.com', 'john@'],
    },
    url: {
        accepts: ['https://api.example.com', 'http://x.io/path?q=1'],
        rejects: [
            'example.com',
            'ftp://host',
            '',
            'https://api.example.com extra text',
            'https://foo bar/baz',
        ],
    },
    uri: {
        accepts: ['https://api.example.com', 'mailto:x@y.z', 'urn:isbn:0451450523'],
        rejects: ['no-scheme-here', '://missing', ''],
    },
    uuid: {
        accepts: ['123e4567-e89b-12d3-a456-426614174000', '123E4567-E89B-12D3-A456-426614174000'],
        rejects: ['123e4567', 'zzze4567-e89b-12d3-a456-426614174000', ''],
    },
    date: {
        accepts: ['2026-07-06', '1999-12-31'],
        rejects: ['06-07-2026', '2026/07/06', '2026-7-6', ''],
    },
    datetime: {
        accepts: [
            '2026-07-06T10:30:00',
            '2026-07-06T10:30:00Z',
            '2026-07-06T10:30:00+01:00',
            '2026-07-06T10:30:00.123Z',
        ],
        rejects: [
            '2026-07-06',
            '10:30:00',
            '',
            '2026-07-06T10:30:00banana',
            '2026-07-06T10:30:00Zzz',
        ],
    },
};

let failures = 0;

for (const [format, vectors] of Object.entries(FORMAT_PATTERN_TEST_VECTORS)) {
    const pattern = FORMAT_PATTERNS[format as keyof typeof FORMAT_PATTERNS];
    if (!pattern) {
        failures++;
        console.error(`FAIL: registry is missing format "${format}"`);
        continue;
    }
    for (const value of vectors.accepts) {
        if (!pattern.test(value)) {
            failures++;
            console.error(`FAIL: ${format} should accept "${value}"`);
        }
    }
    for (const value of vectors.rejects) {
        if (pattern.test(value)) {
            failures++;
            console.error(`FAIL: ${format} should reject "${value}"`);
        }
    }
}

if (failures > 0) {
    console.error(`${failures} format vector failure(s)`);
    process.exit(1);
}

console.log('All format vectors pass');
