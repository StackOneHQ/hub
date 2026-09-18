import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConnectorConfigField, FieldValidation } from '../types';
import { createFormSchema, createValidationFailureRecorder } from './zodSchema';

// Minimal factory: builds a single-field connector config. Only the properties the
// Zod builder reads (`key`, `label`, `type`, `required`, `validation`) actually matter;
// the rest satisfy the `ConnectorConfigField` shape.
function field(overrides: Partial<ConnectorConfigField> & { validation?: FieldValidation }) {
    return {
        key: 'field',
        label: 'Field',
        type: 'text',
        required: false,
        readOnly: false,
        secret: false,
        placeholder: '',
        ...overrides,
    } satisfies ConnectorConfigField;
}

describe('createFormSchema — Falcon resolver', () => {
    it('accepts an empty value on an OPTIONAL Falcon (pattern) field', () => {
        const schema = createFormSchema([
            field({ required: false, validation: { pattern: '^[a-z]+$' } }),
        ]);

        const result = schema.safeParse({ field: '' });

        expect(result.success).toBe(true);
    });

    it('rejects an empty value on a REQUIRED Falcon field with the required message, not the format message', () => {
        const schema = createFormSchema([
            field({ label: 'API Key', required: true, validation: { pattern: '^[a-z]+$' } }),
        ]);

        const result = schema.safeParse({ field: '' });

        expect(result.success).toBe(false);
        if (!result.success) {
            const message = result.error.issues[0].message;
            expect(message).toBe('API Key is required');
            expect(message).not.toBe('API Key format is invalid');
        }
    });

    it('rejects a non-empty value violating a pattern with the custom errorMessage when provided', () => {
        const schema = createFormSchema([
            field({
                validation: { pattern: '^[a-z]+$', errorMessage: 'Only lowercase letters allowed' },
            }),
        ]);

        const result = schema.safeParse({ field: 'ABC123' });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Only lowercase letters allowed');
        }
    });

    it('rejects a non-empty pattern violation with the generated fallback "{Label} format is invalid"', () => {
        const schema = createFormSchema([
            field({ label: 'Subdomain', validation: { pattern: '^[a-z]+$' } }),
        ]);

        const result = schema.safeParse({ field: 'ABC123' });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Subdomain format is invalid');
        }
    });

    it('rejects a format: url violation with no errorMessage using "Must be a valid url"', () => {
        const schema = createFormSchema([field({ validation: { format: 'url' } })]);

        const result = schema.safeParse({ field: 'not a url' });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Must be a valid url');
        }
    });

    it('accepts valid values for format: email, uuid and date', () => {
        const emailSchema = createFormSchema([field({ validation: { format: 'email' } })]);
        const uuidSchema = createFormSchema([field({ validation: { format: 'uuid' } })]);
        const dateSchema = createFormSchema([field({ validation: { format: 'date' } })]);

        expect(emailSchema.safeParse({ field: 'user@example.com' }).success).toBe(true);
        expect(
            uuidSchema.safeParse({ field: '123e4567-e89b-12d3-a456-426614174000' }).success,
        ).toBe(true);
        expect(dateSchema.safeParse({ field: '2026-07-29' }).success).toBe(true);
    });
});

describe('createFormSchema — Legacy resolver', () => {
    it('rejects an invalid value on an OPTIONAL legacy html-pattern field with the error message when provided', () => {
        const schema = createFormSchema([
            field({
                required: false,
                validation: { type: 'html-pattern', pattern: '^[0-9]+$', error: 'Digits only' },
            }),
        ]);

        const result = schema.safeParse({ field: 'abc' });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Digits only');
        }
    });

    it('rejects an invalid legacy html-pattern value with the coded fallback when error is omitted', () => {
        // NOTE: the code's fallback is `Please match the required format: ${pattern}`,
        // NOT the RFC-worded "{Label} is invalid". Asserting the real string.
        const schema = createFormSchema([
            field({
                required: false,
                validation: { type: 'html-pattern', pattern: '^[0-9]+$' },
            }),
        ]);

        const result = schema.safeParse({ field: 'abc' });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe(
                'Please match the required format: ^[0-9]+$',
            );
        }
    });

    it('applies the legacy domain ".com" quirk: value must contain "{pattern}.com"', () => {
        // resolveLegacyRule wraps a `domain` rule as `.*${pattern}\.com.*`, so the value
        // must contain "acme.com" somewhere. A bare "acme" (no ".com") fails; a full
        // "https://acme.com/path" passes.
        const schema = createFormSchema([
            field({ required: false, validation: { type: 'domain', pattern: 'acme' } }),
        ]);

        expect(schema.safeParse({ field: 'acme' }).success).toBe(false);
        expect(schema.safeParse({ field: 'https://acme.com/login' }).success).toBe(true);

        const failed = schema.safeParse({ field: 'acme' });
        if (!failed.success) {
            expect(failed.error.issues[0].message).toBe('Please enter a valid acme.com domain');
        }
    });

    it('routes on `type:` presence — same value passes as Falcon pattern but fails as legacy', () => {
        // Value "acme" satisfies the Falcon pattern ^[a-z]+$ (no `type`), but the legacy
        // `domain` rule (has `type`) rewrites the pattern to require ".com", so it fails.
        // Demonstrates the discriminated-union routing in isLegacyValidation.
        const falconSchema = createFormSchema([field({ validation: { pattern: '^[a-z]+$' } })]);
        const legacySchema = createFormSchema([
            field({ validation: { type: 'domain', pattern: 'acme' } }),
        ]);

        expect(falconSchema.safeParse({ field: 'acme' }).success).toBe(true);
        expect(legacySchema.safeParse({ field: 'acme' }).success).toBe(false);
    });
});

describe('createFormSchema — robustness', () => {
    it('accepts a saved-secret placeholder on a required field without running the rule', () => {
        // Reconnect flow: the field is pre-filled with the redacted sentinel, not a value
        // the customer typed. It must not fail validation (which would gate the Connect
        // button), even against a strict pattern on a required field.
        const schema = createFormSchema([
            field({ required: true, secret: true, validation: { format: 'email' } }),
        ]);

        const result = schema.safeParse({ field: '__secretvalue:**redacted**abcd' });

        expect(result.success).toBe(true);
    });

    it('leaves a field unvalidated (fail-open) when the format is unrecognised', () => {
        const schema = createFormSchema([field({ validation: { format: 'hostname' as never } })]);

        expect(schema.safeParse({ field: 'literally anything' }).success).toBe(true);
    });

    it('degrades an uncompilable pattern to no rule instead of throwing during schema build', () => {
        // createFormSchema runs inside a render useMemo — an uncompilable pattern that threw
        // would take down the whole hub via the error boundary. Treat it as "no rule".
        expect(() => createFormSchema([field({ validation: { pattern: '[' } })])).not.toThrow();

        const schema = createFormSchema([field({ validation: { pattern: '[' } })]);
        expect(schema.safeParse({ field: 'anything' }).success).toBe(true);
    });

    it('warns (never fails dark) when a pattern is skipped for ReDoS or compile failure', () => {
        // The client is the only enforcement layer, so a silently-dropped rule would render
        // a field unvalidated with nobody noticing. Both fail-open paths must warn.
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        createFormSchema([field({ validation: { pattern: '^(a+)+$' } })]); // ReDoS-risky
        createFormSchema([field({ validation: { pattern: '[' } })]); // uncompilable

        expect(warn).toHaveBeenCalledTimes(2);
        warn.mockRestore();
    });

    it('does not run a ReDoS-risky author pattern on every keystroke — degrades to no rule', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const schema = createFormSchema([field({ validation: { pattern: '^(a+)+$' } })]);

        expect(schema.safeParse({ field: 'aaaa' }).success).toBe(true);
        warn.mockRestore();
    });

    it('skips an author pattern for a value over the length cap (fail-open), but never caps a format rule', () => {
        // Author patterns can backtrack quadratically (the star-height lint misses that
        // shape), so a value past the cap is not run. FORMAT_PATTERNS are linear/safe and
        // never capped — a long invalid value still fails.
        const authorSchema = createFormSchema([field({ validation: { pattern: '^[a-z]+$' } })]);
        expect(authorSchema.safeParse({ field: 'A'.repeat(513) }).success).toBe(true);

        const formatSchema = createFormSchema([field({ validation: { format: 'email' } })]);
        expect(formatSchema.safeParse({ field: 'x'.repeat(513) }).success).toBe(false);
    });

    it('accepts a saved-secret placeholder on a NUMBER field, so reconnect is not blocked', () => {
        // The number branch returns before the string secret-placeholder short-circuit, so
        // without its own guard a saved secret would fail `/^\d+$/` and gate Connect.
        const schema = createFormSchema([field({ type: 'number', required: true, secret: true })]);

        expect(schema.safeParse({ field: '__secretvalue:**redacted**abcd' }).success).toBe(true);
        expect(schema.safeParse({ field: '42' }).success).toBe(true);
        expect(schema.safeParse({ field: 'abc' }).success).toBe(false);
    });

    it('accepts the widened datetime offsets synced from @stackone/core', () => {
        const schema = createFormSchema([field({ validation: { format: 'datetime' } })]);

        for (const value of [
            '2026-07-06T10:30:00z',
            '2026-07-06T10:30:00+0100',
            '2026-07-06T10:30:00+01',
        ]) {
            expect(schema.safeParse({ field: value }).success, value).toBe(true);
        }
    });
});

describe('createValidationFailureRecorder — lifetime', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('dispatches at most once per field across schema rebuilds when the recorder outlives the schema', () => {
        const dispatchEvent = vi.fn();
        vi.stubGlobal('window', { dispatchEvent });

        // The schema rebuilds when the connector or account data changes (the fields memo),
        // so the recorder is owned by the component and passed in. Two builds with failing
        // parses simulate two rebuilds; the dedupe must survive them.
        const recordFailure = createValidationFailureRecorder('workday');
        const fields = [field({ validation: { pattern: '^[a-z]+$' } })];
        createFormSchema(fields, recordFailure).safeParse({ field: 'BAD1' });
        createFormSchema(fields, recordFailure).safeParse({ field: 'BAD12' });

        expect(dispatchEvent).toHaveBeenCalledTimes(1);
    });

    it('carries the connector, field and rule kind on the event detail (never the value)', () => {
        const dispatchEvent = vi.fn();
        vi.stubGlobal('window', { dispatchEvent });

        const recordFailure = createValidationFailureRecorder('workday');
        createFormSchema([field({ validation: { pattern: '^[a-z]+$' } })], recordFailure).safeParse(
            { field: 'BAD1' },
        );

        expect(dispatchEvent.mock.calls[0][0].detail).toEqual({
            connector: 'workday',
            field: 'field',
            ruleKind: 'pattern',
        });
    });
});

describe('createFormSchema — ReDoS guard', () => {
    it('treats a nested-quantifier pattern as no rule instead of hanging per keystroke', () => {
        // `^(a+)+$` backtracks exponentially on a near-miss value; the lint copy in
        // regexSafety.ts drops the rule (fail open) so the tab never hangs.
        const schema = createFormSchema([field({ validation: { pattern: '^(a+)+$' } })]);
        const start = Date.now();

        const result = schema.safeParse({ field: `${'a'.repeat(60)}!` });

        expect(result.success).toBe(true);
        expect(Date.now() - start).toBeLessThan(1000);
    });

    it('treats a repeated-alternation pattern as no rule (the star-height blind spot)', () => {
        const schema = createFormSchema([field({ validation: { pattern: '(a|a)+$' } })]);
        const start = Date.now();

        const result = schema.safeParse({ field: `${'a'.repeat(40)}!` });

        expect(result.success).toBe(true);
        expect(Date.now() - start).toBeLessThan(1000);
    });

    it('still applies a safe legacy html-pattern rule (guard is not over-broad)', () => {
        const schema = createFormSchema([
            field({ validation: { type: 'html-pattern', pattern: '^[0-9]+$' } }),
        ]);

        expect(schema.safeParse({ field: 'abc' }).success).toBe(false);
    });
});
