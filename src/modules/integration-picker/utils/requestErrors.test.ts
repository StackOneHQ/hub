import { describe, expect, it } from 'vitest';
import { HubRequestError } from '../../../shared/httpClient';
import {
    CONNECT_ERROR_FALLBACK,
    LOAD_ERROR_FALLBACK,
    LOAD_ERROR_TITLE,
    PROVIDER_RESPONSE_FALLBACK,
    SERVER_ERROR_FALLBACK,
    describeConnectError,
    describeLoadError,
    errorStatus,
} from './requestErrors';

describe('errorStatus', () => {
    it("reads the status off the API's answer", () => {
        expect(errorStatus(new HubRequestError(403, 'Forbidden'))).toBe(403);
    });

    it('has none for a request that never got an answer', () => {
        expect(errorStatus(new TypeError('Failed to fetch'))).toBeUndefined();
    });
});

describe('describeLoadError', () => {
    it("shows the server's own message under the title and offers a retry on a server error", () => {
        const actual = describeLoadError(
            new HubRequestError(
                503,
                'Could not verify connector profile access. Please try again.',
            ),
        );

        expect(actual).toEqual({
            title: LOAD_ERROR_TITLE,
            message: 'Could not verify connector profile access. Please try again.',
            retryable: true,
        });
    });

    it('offers no retry when the API refused the request', () => {
        expect(describeLoadError(new HubRequestError(404, 'Integration not found')).retryable).toBe(
            false,
        );
    });

    it('asks to check the connection when the request never got an answer', () => {
        expect(describeLoadError(new TypeError('Failed to fetch'))).toEqual({
            title: LOAD_ERROR_TITLE,
            message: LOAD_ERROR_FALLBACK,
            retryable: true,
        });
    });

    it('says the fault is on our side when the server sent no message', () => {
        expect(describeLoadError(new HubRequestError(502, '')).message).toBe(SERVER_ERROR_FALLBACK);
    });

    it('offers a retry when the request timed out', () => {
        expect(describeLoadError(new HubRequestError(408, 'Request timed out')).retryable).toBe(
            true,
        );
    });

    it('offers a retry when the hub was rate limited', () => {
        expect(describeLoadError(new HubRequestError(429, 'Too many requests')).retryable).toBe(
            true,
        );
    });
});

describe('describeConnectError', () => {
    it("shows the server's message and the provider's response it sent", () => {
        const actual = describeConnectError(
            new HubRequestError(400, 'Invalid credentials', {
                provider_response: '{"error":"bad key"}',
            }),
        );

        expect(actual).toEqual({
            message: 'Invalid credentials',
            provider_response: '{"error":"bad key"}',
        });
    });

    it('unpacks a message that carries the provider answer as JSON', () => {
        const actual = describeConnectError(
            new HubRequestError(
                400,
                JSON.stringify({ message: 'Token rejected', provider_response: 'expired' }),
            ),
        );

        expect(actual).toEqual({ message: 'Token rejected', provider_response: 'expired' });
    });

    it('keeps the thrown message for a failure the API did not answer', () => {
        expect(describeConnectError(new Error('Failed to create account'))).toEqual({
            message: 'Failed to create account',
            provider_response: PROVIDER_RESPONSE_FALLBACK,
        });
    });

    it('falls back when nothing usable came back', () => {
        expect(describeConnectError(new HubRequestError(500, ''))).toEqual({
            message: CONNECT_ERROR_FALLBACK,
            provider_response: PROVIDER_RESPONSE_FALLBACK,
        });
    });
});
