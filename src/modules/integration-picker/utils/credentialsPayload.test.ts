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

const shownFields = [
    field({ key: 'apiUrl', required: true, value: 'https://api.example.com' }),
    field({ key: 'region', value: 'eu' }),
    field({ key: 'retries', value: '3' }),
    field({ key: 'subdomain' }),
    field({ key: 'apiKey', secret: true, required: true, value: placeholder }),
    field({ key: 'apiToken', type: 'password', value: placeholder }),
];

describe('buildCredentialsPayload', () => {
    describe('when editing an account', () => {
        it('sends a field the form showed with a value and the user emptied as null', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', region: '', retries: '' },
                fields: shownFields,
                editingSecrets: new Set(),
                editing: true,
            });

            expect(actual).toEqual({
                apiUrl: 'https://api.example.com',
                region: null,
                retries: null,
            });
        });

        it('sends a field showing a connector default the user emptied as null', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', timeout: '' },
                fields: [...shownFields, field({ key: 'timeout', type: 'number', value: 0 })],
                editingSecrets: new Set(),
                editing: true,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com', timeout: null });
        });

        it('never clears a secret field, even one showing a real value', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiToken: '' },
                fields: [
                    ...shownFields.filter((f) => f.key !== 'apiToken'),
                    field({ key: 'apiToken', type: 'password', value: 'legacy-token' }),
                ],
                editingSecrets: new Set(['apiToken']),
                editing: true,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com' });
        });

        it('never clears a required field, leaving the stored value to the API', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: '', region: 'eu' },
                fields: shownFields,
                editingSecrets: new Set(),
                editing: true,
            });

            expect(actual).toEqual({ region: 'eu' });
        });

        it('leaves out an empty field the form showed without a value', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', subdomain: '' },
                fields: shownFields,
                editingSecrets: new Set(),
                editing: true,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com' });
        });

        it('leaves out a secret the user did not open, so the stored one is kept', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiKey: placeholder },
                fields: shownFields,
                editingSecrets: new Set(),
                editing: true,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com' });
        });

        it('leaves out a secret the user opened and left empty, so the stored one is kept', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiToken: '' },
                fields: shownFields,
                editingSecrets: new Set(['apiToken']),
                editing: true,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com' });
        });

        it('sends a placeholder the user opened as it stands', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiKey: placeholder },
                fields: shownFields,
                editingSecrets: new Set(['apiKey']),
                editing: true,
            });

            expect(actual).toEqual({ apiUrl: 'https://api.example.com', apiKey: placeholder });
        });

        it('sends a value the user entered', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', apiKey: 'new-key', region: 'us' },
                fields: shownFields,
                editingSecrets: new Set(['apiKey']),
                editing: true,
            });

            expect(actual).toEqual({
                apiUrl: 'https://api.example.com',
                apiKey: 'new-key',
                region: 'us',
            });
        });
    });

    describe('when nothing stored is shown, as on a new account or another profile', () => {
        it('leaves out an empty field', () => {
            const actual = buildCredentialsPayload({
                formData: { apiUrl: 'https://api.example.com', region: '', apiToken: '' },
                fields: shownFields,
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
