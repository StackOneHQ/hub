// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { FeatureFlagProvider } from '../../shared/contexts/featureFlagContext';
import {
    type MountedView,
    clickOn,
    stubLayoutWidth,
    withMounted,
} from '../../shared/testing/clientRender';
import { FeatureFlag } from '../../shared/types/featureFlags';
import { IntegrationPicker } from './IntegrationPicker';
import {
    AuthenticationGuides,
    FalconConnectorConfig,
    HubConnectorConfig,
    Integration,
} from './types';

const INTEGRATION_ID = 'bamboohr-1';
const DOCS_LINK = 'https://docs.stackone.com/connectors/bamboohr';

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

const aConnectorShipping = (guides?: AuthenticationGuides | null): HubConnectorConfig => {
    const config: FalconConnectorConfig = {
        key: 'bamboohr',
        name: 'BambooHR',
        type: 'custom',
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
        support: { link: DOCS_LINK, guides },
    };

    return { config, hub_settings: { configured_webhook_events: {}, project_settings: {} } };
};

const anAccountLinkingGuide = (): AuthenticationGuides => ({
    config: {
        sections: [
            {
                title: 'Open the API Keys page',
                content: 'Click your avatar.',
                steps: [{ title: 'Generate a key', content: 'Press Add New Key.' }],
            },
            { title: 'Paste the key below', content: 'It is shown once.' },
        ],
    },
});

/**
 * The whole path a guide travels: the connector payload the hub already receives, through the
 * picker, to the screen. Nothing here is allowed to reach the network.
 */
const inHub = <T,>(
    width: number,
    guides: AuthenticationGuides | null | undefined,
    featureFlags: FeatureFlag[],
    body: (view: MountedView, resizeTo: (next: number) => void) => T,
): T => {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
    });
    client.setQueryData(['hubData', undefined], { integrations: [anIntegration()] });
    client.setQueryData(['connectorData', INTEGRATION_ID], aConnectorShipping(guides));
    client.setQueryData(['connectorProfiles', 'bamboohr'], { profiles: [] });

    const layout = stubLayoutWidth(width);

    try {
        return withMounted(
            <QueryClientProvider client={client}>
                <FeatureFlagProvider featureFlags={featureFlags}>
                    <IntegrationPicker
                        token="a-session-token"
                        baseUrl="https://api.example.invalid"
                        height="600px"
                    />
                </FeatureFlagProvider>
            </QueryClientProvider>,
            (view) =>
                body(view, (next) => {
                    view.interact(() => layout.resizeTo(next));
                }),
        );
    } finally {
        layout.restore();
    }
};

const renderHub = (
    width: number,
    guides?: AuthenticationGuides | null,
    featureFlags: FeatureFlag[] = ['hub_connection_guide_release'],
): { text: string; guideLink: boolean } =>
    inHub(width, guides, featureFlags, (view) => ({
        text: view.text(),
        guideLink: view.container.querySelector(`a[href="${DOCS_LINK}"]`) !== null,
    }));

const WITH_FLAG: FeatureFlag[] = ['hub_connection_guide_release'];

const next = (view: MountedView) => {
    const button = view.container.querySelector('button[aria-label="Next step"]');
    view.interact(() => button && clickOn(button));
};

const renderHubAtWidth = (width: number, guides?: AuthenticationGuides | null): string =>
    renderHub(width, guides).text;

describe('#IntegrationPicker', () => {
    describe('when the connector payload carries an account linking guide', () => {
        it('puts the guide on screen beside the form in a wide host', () => {
            // act
            const actual = renderHubAtWidth(672, anAccountLinkingGuide());

            // assert
            expect(actual).toContain('API Key');
            expect(actual).toContain('Open the API Keys page');
            expect(actual).toContain('Generate a key');
            expect(actual).not.toContain('Paste the key below');
        });

        it('pages the guide above the form in a narrow host', () => {
            // act
            const actual = renderHubAtWidth(490, anAccountLinkingGuide());

            // assert
            expect(actual).toContain('API Key');
            expect(actual).toContain('Open the API Keys page');
            expect(actual).not.toContain('Paste the key below');
        });
    });

    describe('when the connector payload carries no account linking guide', () => {
        it('shows the credential fields on their own', () => {
            // act
            const actual = renderHubAtWidth(672, null);

            // assert
            expect(actual).toContain('API Key');
            expect(actual).not.toContain('Open the API Keys page');
            expect(actual).not.toContain('Step 1 of');
        });

        it('keeps the link to the published guide', () => {
            // act
            const actual = renderHub(672, null).guideLink;

            // assert
            expect(actual).toBe(true);
        });
    });

    describe('when the inline guide is on screen', () => {
        it('drops the link to the published guide', () => {
            // act
            const actual = renderHub(672, anAccountLinkingGuide()).guideLink;

            // assert
            expect(actual).toBe(false);
        });
    });

    describe('when the organization is not in the guide rollout', () => {
        it('shows the form and the link exactly as before', () => {
            // act
            const actual = renderHub(672, anAccountLinkingGuide(), []);

            // assert
            expect(actual.text).toContain('API Key');
            expect(actual.text).not.toContain('Open the API Keys page');
            expect(actual.guideLink).toBe(true);
        });
    });

    describe('when the guide sits beside the form', () => {
        it('puts the header above the guide column, and the footer under the form only', () => {
            // act
            const actual = inHub(672, anAccountLinkingGuide(), WITH_FLAG, (view) => {
                const region = view.container.querySelector(
                    '[aria-label="Open the API Keys page"]',
                );
                const column = region?.closest('[style*="border-right"]') ?? null;
                const header = view.container.querySelector('.card-header');
                const connect = view.button('Connect');
                const innerCard = connect.closest('.card-base');
                const follows = (first: Element | null, second: Element | null) =>
                    Boolean(
                        first &&
                            second &&
                            first.compareDocumentPosition(second) &
                                Node.DOCUMENT_POSITION_FOLLOWING,
                    );
                return {
                    headerFirst: follows(header, column),
                    headerHasConnectorName: Boolean(header?.textContent?.includes('BambooHR')),
                    headerInsideInnerCard: Boolean(innerCard?.contains(header)),
                    guideBeforeConnect: follows(column, connect),
                    connectInsideGuide: Boolean(column?.contains(connect)),
                    headerCount: view.container.querySelectorAll('.card-header').length,
                };
            });

            // assert
            expect(actual).toEqual({
                headerFirst: true,
                headerHasConnectorName: true,
                headerInsideInnerCard: false,
                guideBeforeConnect: true,
                connectInsideGuide: false,
                headerCount: 1,
            });
        });

        it('returns to the same step after being hidden and shown', () => {
            // act
            const actual = inHub(672, anAccountLinkingGuide(), WITH_FLAG, (view) => {
                next(view);
                view.interact(() => clickOn(view.button('Hide guide')));
                const hidden = view.text();
                view.interact(() => clickOn(view.button('Show guide')));
                return { hidden, shown: view.text() };
            });

            // assert
            expect(actual.hidden).not.toContain('Connection guide');
            expect(actual.shown).toContain('Paste the key below');
        });

        it('keeps the step through a resize from narrow to wide', () => {
            // act
            const actual = inHub(490, anAccountLinkingGuide(), WITH_FLAG, (view, resizeTo) => {
                next(view);
                resizeTo(672);
                return view.text();
            });

            // assert
            expect(actual).toContain('Paste the key below');
            expect(actual).not.toContain('Generate a key');
        });
    });

    describe('when the organization is not in the guide rollout', () => {
        it('renders a single card with no wrapper around it', () => {
            // act
            const actual = inHub(
                672,
                anAccountLinkingGuide(),
                [],
                (view) => view.container.querySelectorAll('.card-base').length,
            );

            // assert
            expect(actual).toBe(1);
        });
    });
});
