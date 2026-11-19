import { describe, expect, it } from 'vitest';
import type { ConnectorConfigField } from '../types';
import { buildCredentialsPayload, withoutClearedFields } from './credentialsPayload';

const field = (overrides: Partial<ConnectorConfigField>): ConnectorConfigField => ({
    label: overrides.key ?? 'field',
    key: 'field',
    required: false,
    readOnly: false,
    secret: false,
    placeholder: '',
    ...overrides,
});

const placeholder = '__secretvalue:**redacted**1234';

const fields = [
    field({ key: 'apiUrl', required: true }),
    field({ key: 'region' }),
    field({ key: 'retries' }),
    field({ key: 'apiKey', secret: true, required: true }),
    field({ key: 'apiToken', type: 'password' }),
];

const stored = { apiUrl: 'https://api.example.com', region: 'eu' };

describe('buildCredentialsPayload', () => {
    describe('when editing an account', () => {
        it('sends a field the user emptied as null', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', region: '' },
                fields,
                editingSecrets: new Set(),
                storedSetupInformation: stored,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com', region: null });
        });

        it('leaves out an empty field that had no stored value to show', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', region: 'eu', retries: '' },
                fields,
                editingSecrets: new Set(),
                storedSetupInformation: stored,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com', region: 'eu' });
        });

        it('leaves out a secret the user did not open, so the stored one is kept', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiKey: placeholder },
                fields,
                editingSecrets: new Set(),
                storedSetupInformation: stored,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com' });
        });

        it('leaves out a secret the user opened and left empty, so the stored one is kept', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiToken: '' },
                fields,
                editingSecrets: new Set(['apiToken']),
                storedSetupInformation: stored,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com' });
        });

        it('never clears a secret field, even one with a stored setup value', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiToken: '' },
                fields,
                editingSecrets: new Set(['apiToken']),
                storedSetupInformation: { ...stored, apiToken: 'legacy-token' },
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com' });
        });

        it('sends a placeholder the user opened as it stands', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiKey: placeholder },
                fields,
                editingSecrets: new Set(['apiKey']),
                storedSetupInformation: stored,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com', apiKey: placeholder });
        });

        it('sends a value the user entered', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiKey: 'new-key', region: 'us' },
                fields,
                editingSecrets: new Set(['apiKey']),
                storedSetupInformation: stored,
            });

            expect(actual).toEqual({
                apiUrl: 'https://api.example.com',
                apiKey: 'new-key',
                region: 'us',
            });
        });
    });

    describe('when nothing stored was shown, as on a new account or another profile', () => {
        it('leaves out an empty field', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', region: '', apiToken: '' },
                fields,
                editingSecrets: new Set(),
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com' });
        });
    });
});

describe('withoutClearedFields', () => {
    it('drops the cleared fields and keeps the rest', () => {
        const actual = withoutClearedFields({ apiUrl: 'https://api.example.com', region: null });

        expect(actual).toEqual({ apiUrl: 'https://api.example.com' });
    });
});
