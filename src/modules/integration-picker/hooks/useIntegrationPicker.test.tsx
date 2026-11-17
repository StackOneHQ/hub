// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { withMounted } from '../../../shared/testing/clientRender';
import {
    AuthenticationGuides,
    FalconConnectorConfig,
    Guide,
    HubConnectorConfig,
    Integration,
} from '../types';
import { useIntegrationPicker } from './useIntegrationPicker';

const INTEGRATION_ID = 'bamboohr-1';

const anIntegration = (): Integration => ({
    active: true,
    name: 'BambooHR',
    provider: 'bamboohr',
    type: 'hris',
    version: '1.0.0',
    authentication_config_key: 'api_key',
    environment: 'production',
    integration_id: INTEGRATION_ID,
    logo_url: 'https://example.com/bamboohr.png',
});

const anAccountLinkingGuide = (): Guide => ({
    sections: [{ title: 'Open the API Keys page', content: 'Click your avatar.' }],
});

const anAdminSetupGuide = (): Guide => ({
    sections: [{ title: 'Register an application', content: 'Admins only.' }],
});

/** Shaped after Slack's: a step that introduces a scope list the hub cannot fill in. */
const aGuideWrittenAgainstScopes = (): Guide => ({
    sections: [
        { title: 'Create an app', content: 'Create it in the workspace you want to connect.' },
        {
            title: 'Add scopes and install the app',
            steps: [
                {
                    title: 'Add bot token scopes',
                    content: 'Add each scope StackOne needs, one at a time. At minimum add:',
                    displayScopes: true,
                    applicableScopes: 'users:read chat:write',
                },
            ],
        },
    ],
});

const aFalconConnector = (
    guides?: AuthenticationGuides | null,
    requiredScopes?: ReadonlyArray<string>,
): HubConnectorConfig => {
    const config: FalconConnectorConfig = {
        key: 'bamboohr',
        name: 'BambooHR',
        type: 'custom',
        requiredScopes,
        configFields: [
            {
                type: 'password',
                label: 'API Key',
                key: 'api_key',
                required: true,
                readOnly: false,
                secret: true,
                placeholder: 'Paste your key',
            },
        ],
        support: { link: 'https://docs.stackone.com/connectors/bamboohr', guides },
    };

    return {
        config,
        hub_settings: { configured_webhook_events: {}, project_settings: {} },
    };
};

/**
 * The hub picks the only active connector for itself, so seeding the cache is enough to reach
 * the derivation; nothing here is allowed to reach the network.
 */
const connectionGuideFor = (connector: HubConnectorConfig): Guide | undefined => {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
        },
    });
    client.setQueryData(['hubData', undefined], { integrations: [anIntegration()] });
    client.setQueryData(['connectorData', INTEGRATION_ID], connector);
    client.setQueryData(['connectorProfiles', 'bamboohr'], { profiles: [] });

    let actual: Guide | undefined;

    const Probe: React.FC = () => {
        actual = useIntegrationPicker({
            token: 'a-session-token',
            baseUrl: 'https://api.example.invalid',
        }).connectionGuide;
        return null;
    };

    withMounted(
        <QueryClientProvider client={client}>
            <Probe />
        </QueryClientProvider>,
        () => undefined,
    );

    return actual;
};

describe('#useIntegrationPicker', () => {
    describe('when the connector ships an account linking guide', () => {
        it('hands it to the picker, so the hub can render it beside the form', () => {
            // act
            const actual = connectionGuideFor(
                aFalconConnector({ config: anAccountLinkingGuide() }),
            );

            // assert
            expect(actual).toEqual(anAccountLinkingGuide());
        });
    });

    describe('when the connector ships only the admin connector profile guide', () => {
        it('hands over nothing, because setup is not the end user’s guide', () => {
            // act
            const actual = connectionGuideFor(aFalconConnector({ setup: anAdminSetupGuide() }));

            // assert
            expect(actual).toBeUndefined();
        });
    });

    describe('when the connector ships both guides', () => {
        it('hands over the account linking one and leaves the admin one behind', () => {
            // act
            const actual = connectionGuideFor(
                aFalconConnector({
                    config: anAccountLinkingGuide(),
                    setup: anAdminSetupGuide(),
                }),
            );

            // assert
            expect(actual).toEqual(anAccountLinkingGuide());
        });
    });

    describe('when the account linking guide is written against the project’s scopes', () => {
        it('hands over nothing, because this payload carries no scopes to write in', () => {
            // act
            const actual = connectionGuideFor(
                aFalconConnector({ config: aGuideWrittenAgainstScopes() }),
            );

            // assert
            expect(actual).toBeUndefined();
        });
    });

    describe('when the account linking guide is scope dependent and the scopes are sent', () => {
        it('hands over the guide written for those scopes', () => {
            // act
            const actual = connectionGuideFor(
                aFalconConnector({ config: aGuideWrittenAgainstScopes() }, ['chat:write']),
            );

            // assert
            expect(actual).toEqual({
                sections: [
                    {
                        title: 'Create an app',
                        content: 'Create it in the workspace you want to connect.',
                    },
                    {
                        title: 'Add scopes and install the app',
                        steps: [
                            {
                                title: 'Add bot token scopes',
                                content:
                                    'Add each scope StackOne needs, one at a time. At minimum add:',
                                list: ['`chat:write`'],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe('when the connector ships no guide at all', () => {
        it('hands over nothing', () => {
            // act
            const actual = [
                connectionGuideFor(aFalconConnector(undefined)),
                connectionGuideFor(aFalconConnector(null)),
            ];

            // assert
            expect(actual).toEqual([undefined, undefined]);
        });
    });
});
