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

    it('puts the auth method on the second line and marks the default with a pill', () => {
        const items = profileOptions([
            profile({
                integration_id: 'a',
                profile_name: 'Ashby EU',
                is_default: true,
                authentication_config_label: 'OAuth 2.0',
            }),
            profile({ integration_id: 'b', profile_name: 'Ashby US' }),
        ]);

        expect(
            items.map(({ id, label, subtitle, triggerTag }) => ({
                id,
                label,
                subtitle,
                triggerTag,
            })),
        ).toEqual([
            { id: 'a', label: 'Ashby EU', subtitle: 'OAuth 2.0', triggerTag: 'Default' },
            { id: 'b', label: 'Ashby US', subtitle: undefined, triggerTag: undefined },
        ]);
        expect(items[0].badgePlacement).toBe('label');
        expect(isValidElement(items[0].badge) && items[0].badge.props).toMatchObject({
            type: 'default',
            value: 'Default',
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
