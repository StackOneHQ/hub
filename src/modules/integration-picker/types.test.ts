import { describe, expect, it } from 'vitest';
import { type FalconConnectorConfig, type LegacyConnectorConfig, isLinkedAtSignIn } from './types';

const falconConfig = (overrides: Partial<FalconConnectorConfig> = {}): FalconConnectorConfig => ({
    key: 'todo',
    name: 'Todo',
    type: 'custom',
    configFields: [],
    ...overrides,
});

const legacyConfig: LegacyConnectorConfig = {
    key: 'todo',
    name: 'Todo',
    authentication: {},
};

describe('#isLinkedAtSignIn', () => {
    describe('when the identity provider links the accounts at sign-in', () => {
        it('is true', () => {
            expect(isLinkedAtSignIn(falconConfig({ linkedAtSignIn: true }))).toBe(true);
        });
    });

    describe('when the user connects the account here', () => {
        it('is false', () => {
            expect(isLinkedAtSignIn(falconConfig())).toBe(false);
        });
    });

    describe('when the config is a legacy one, or has not loaded', () => {
        it('is false', () => {
            expect(isLinkedAtSignIn(legacyConfig)).toBe(false);
            expect(isLinkedAtSignIn(undefined)).toBe(false);
        });
    });
});
