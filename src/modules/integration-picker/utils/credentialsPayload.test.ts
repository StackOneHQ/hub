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
    field({ key: 'apiKey', secret: true, required: true }),
    field({ key: 'apiToken', type: 'password' }),
];

describe('buildCredentialsPayload', () => {
    describe('when editing an account', () => {
        it('sends a cleared field as null', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', region: '' },
                fields,
                editingSecrets: new Set(),
                editing: true,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com', region: null });
        });

        it('leaves out a secret the user did not open, so the stored one is kept', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiKey: placeholder },
                fields,
                editingSecrets: new Set(),
                editing: true,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com' });
        });

        it('sends a secret the user opened and emptied as null', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiToken: '' },
                fields,
                editingSecrets: new Set(['apiToken']),
                editing: true,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com', apiToken: null });
        });

        it('sends a value the user entered', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiKey: 'new-key', region: 'eu' },
                fields,
                editingSecrets: new Set(['apiKey']),
                editing: true,
            });

            expect(actual).toEqual({
                apiUrl: 'https://api.example.com',
                apiKey: 'new-key',
                region: 'eu',
            });
        });
    });

    describe('when creating an account', () => {
        it('leaves out an empty field', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', region: '', apiToken: '' },
                fields,
                editingSecrets: new Set(),
                editing: false,
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
