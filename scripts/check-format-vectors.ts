/**
 * Conformance gate for the hub's local FORMAT_PATTERNS copy, run via `npm test`.
 * Two offline layers — be precise about what each can and cannot catch:
 *
 *  1. Vectors: every pattern passes the pinned accept/reject vectors, and every
 *     registry key has vectors. Catches semantic drift the vectors encode — but NOT
 *     a regression that keeps the accepted language identical (the round-1 quadratic
 *     `url` form passed every vector).
 *  2. Pinned canonical sources: every pattern's source+flags must equal the
 *     canonical regex text pinned below. Catches language-identical rewrites
 *     drifting from canonical.
 *
 * What NO layer here can catch: a format ADDED to connect's registry after these
 *  pins were taken. Both sides of every check are hub-local snapshots, and there is
 *  no live comparison — `StackOneHQ/connect` is private, so an unauthenticated fetch
 *  of the canonical file 404s permanently, and pulling private source into this
 *  public repo's CI is not an option. An upstream format addition therefore requires
 *  a MANUAL sync: bump the registry copy (utils/zodSchema.ts), these vectors, and
 *  the pinned sources together.
 *
 * Canonical sources: connect repo, `packages/core/src/connector/formatPatterns.ts`
 * and `packages/core/src/connector/specs/formatPatterns.vectors.ts`.
 */
import { FORMAT_PATTERNS } from '../src/modules/integration-picker/utils/zodSchema';

// Layer 2 pin: the canonical regex text, verbatim (source without delimiters, then
// flags). Snapshot of connect#1304 head — bump alongside the registry copy.
const CANONICAL_PATTERN_SOURCES: Record<string, { source: string; flags: string }> = {
    email: { source: '^[^\\s@]+@(?=[^\\s@]+\\.[^\\s@])[^\\s@]+$', flags: '' },
    url: { source: '^https?:\\/\\/[^\\s/?#]+(?:[/?#]\\S*)?$', flags: '' },
    uri: { source: '^[a-zA-Z][a-zA-Z0-9+.-]*:\\S+$', flags: '' },
    uuid: {
        source: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        flags: 'i',
    },
    date: { source: '^\\d{4}-\\d{2}-\\d{2}$', flags: '' },
    datetime: {
        source: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:[Zz]|[+-]\\d{2}(?::?\\d{2})?)?$',
        flags: '',
    },
};

const FORMAT_PATTERN_TEST_VECTORS: Record<string, { accepts: string[]; rejects: string[] }> = {
    email: {
        accepts: ['john@example.com', 'a.b+tag@sub.domain.co'],
        rejects: [
            'not-an-email',
            'a b@example.com',
            '@example.com',
            'john@',
            'john@example.com extra text',
        ],
    },
    url: {
        accepts: [
            'https://api.example.com',
            'http://x.io/path?q=1',
            'http://localhost:3000',
            'https://1.2.3.4/p?q=1',
            'https://x.io/a?b=c#d',
        ],
        rejects: [
            'example.com',
            'ftp://host',
            '',
            'https://api.example.com extra text',
            'https://foo bar/baz',
            'https://',
            'https://?q=1',
            'https:///path',
            'https://#frag',
            'https://a b',
        ],
    },
    uri: {
        accepts: ['https://api.example.com', 'mailto:x@y.z', 'urn:isbn:0451450523'],
        rejects: [
            'no-scheme-here',
            '://missing',
            '',
            'urn:isbn:0451450523 and some trailing prose',
            'mailto:a@b.c <-- paste error',
        ],
    },
    uuid: {
        accepts: ['123e4567-e89b-12d3-a456-426614174000', '123E4567-E89B-12D3-A456-426614174000'],
        rejects: [
            '123e4567',
            'zzze4567-e89b-12d3-a456-426614174000',
            '',
            '123e4567-e89b-12d3-a456-426614174000 extra',
        ],
    },
    date: {
        accepts: ['2026-07-06', '1999-12-31'],
        rejects: ['06-07-2026', '2026/07/06', '2026-7-6', '', '2026-07-06 extra'],
    },
    datetime: {
        accepts: [
            '2026-07-06T10:30:00',
            '2026-07-06T10:30:00Z',
            '2026-07-06T10:30:00+01:00',
            '2026-07-06T10:30:00.123Z',
            '2026-07-06T10:30:00z',
            '2026-07-06T10:30:00+0100',
            '2026-07-06T10:30:00+01',
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

// Layer 1: pattern <-> vector conformance.
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

// Reverse coverage: a format added to the registry (mirroring a new core format) with no
// vectors here would otherwise pass silently — the exact drift D3 exists to catch (a field
// with an unrecognised format renders unvalidated). Fail if any registry key lacks vectors.
for (const format of Object.keys(FORMAT_PATTERNS)) {
    if (!FORMAT_PATTERN_TEST_VECTORS[format]) {
        failures++;
        console.error(`FAIL: no vectors for registry format "${format}"`);
    }
}

// Layer 2: pinned canonical sources — catches a rewrite that keeps the accepted
// language identical (invisible to vectors) but drifts from the canonical regex text.
for (const [format, canonical] of Object.entries(CANONICAL_PATTERN_SOURCES)) {
    const pattern = FORMAT_PATTERNS[format as keyof typeof FORMAT_PATTERNS];
    if (!pattern) {
        failures++;
        console.error(`FAIL: registry is missing pinned canonical format "${format}"`);
        continue;
    }
    if (pattern.source !== canonical.source || pattern.flags !== canonical.flags) {
        failures++;
        console.error(
            `FAIL: ${format} source drifted from the pinned canonical\n  local:     /${pattern.source}/${pattern.flags}\n  canonical: /${canonical.source}/${canonical.flags}`,
        );
    }
}
for (const format of Object.keys(FORMAT_PATTERNS)) {
    if (!CANONICAL_PATTERN_SOURCES[format]) {
        failures++;
        console.error(`FAIL: no pinned canonical source for registry format "${format}"`);
    }
}

if (failures > 0) {
    console.error(`${failures} format conformance failure(s)`);
    process.exit(1);
}

console.log(
    'All format vectors and canonical-source checks pass (hub-local pins — an upstream format addition needs a manual sync, see header)',
);
