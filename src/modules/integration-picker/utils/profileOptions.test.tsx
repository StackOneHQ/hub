import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { ConnectorProfile } from '../types';
import { profileOptions } from './profileOptions';

function profile(overrides: Partial<ConnectorProfile>): ConnectorProfile {
    return {
        active: true,
        name: 'Ashby',
        provider: 'ashby',
        type: 'ats',
        version: '1.0.0',
        authentication_config_key: 'api_key',
        environment: 'production',
        integration_id: 'profile-1',
        logo_url: 'https://example.com/ashby.png',
        profile_name: 'Ashby',
        is_default: false,
        authentication_config_label: null,
        ...overrides,
    };
}

describe('profileOptions', () => {
    it('offers nothing when there is no other profile to switch to', () => {
        expect(profileOptions(undefined)).toEqual([]);
        expect(profileOptions([profile({})])).toEqual([]);
    });

    it('labels each profile by its own name, marks the default, and tags its auth method in blue', () => {
        const items = profileOptions([
            profile({
                integration_id: 'a',
                profile_name: 'Ashby EU',
                is_default: true,
                authentication_config_label: 'OAuth 2.0',
            }),
            profile({ integration_id: 'b', profile_name: 'Ashby US' }),
        ]);

        expect(items.map(({ id, label, subtitle }) => ({ id, label, subtitle }))).toEqual([
            { id: 'a', label: 'Ashby EU', subtitle: 'Default' },
            { id: 'b', label: 'Ashby US', subtitle: undefined },
        ]);
        expect(isValidElement(items[0].badge) && items[0].badge.props).toMatchObject({
            type: 'info',
            value: 'OAuth 2.0',
        });
        expect(items[1].badge).toBeUndefined();
    });

    it('falls back to the connector name for a profile without one', () => {
        const items = profileOptions([
            profile({ integration_id: 'a', profile_name: '' }),
            profile({ integration_id: 'b', profile_name: 'Ashby US' }),
        ]);

        expect(items[0].label).toBe('Ashby');
    });
});
