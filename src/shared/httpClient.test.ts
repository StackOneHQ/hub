import { describe, expect, it } from 'vitest';
import { HubRequestError, request } from './httpClient';

const quietLogger = { error: () => undefined, warn: () => undefined } as unknown as Console;

const answering = (status: number, body: unknown) => async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('request', () => {
    it("throws the API's error with its status and message as readable text", async () => {
        const actual = request({
            url: 'https://api.example/hub/connectors',
            method: 'GET',
            requestFn: answering(503, {
                statusCode: 503,
                message: 'Could not verify connector profile access. Please try again.',
                timestamp: '2026-11-02T12:49:34.786Z',
            }),
            logger: quietLogger,
        });

        await expect(actual).rejects.toMatchObject({
            name: 'HubRequestError',
            status: 503,
            message: 'Could not verify connector profile access. Please try again.',
            details: { timestamp: '2026-11-02T12:49:34.786Z' },
        });
    });

    it('joins a list of validation messages into one line', async () => {
        const actual = request({
            url: 'https://api.example/accounts',
            method: 'POST',
            requestFn: answering(400, {
                statusCode: 400,
                message: ['name is required', 'key must be a string'],
            }),
            logger: quietLogger,
        });

        await expect(actual).rejects.toThrow(
            new HubRequestError(400, 'name is required, key must be a string'),
        );
    });

    it("keeps the status of an error answer that isn't the API's own shape", async () => {
        const actual = request({
            url: 'https://api.example/hub/connectors',
            method: 'GET',
            requestFn: answering(404, { message: 'Not Found' }),
            logger: quietLogger,
        });

        await expect(actual).rejects.toMatchObject({ status: 404, message: 'Not Found' });
    });

    it('keeps the status of an error page with no JSON in it', async () => {
        const actual = request({
            url: 'https://api.example/hub/connectors',
            method: 'GET',
            requestFn: async () => new Response('<html>Bad Gateway</html>', { status: 502 }),
            logger: quietLogger,
        });

        await expect(actual).rejects.toMatchObject({ status: 502, message: '' });
    });
});
