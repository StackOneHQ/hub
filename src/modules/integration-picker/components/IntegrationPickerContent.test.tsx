// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { clickOn, withMounted } from '../../../shared/testing/clientRender';
import { ConnectorConfig, Integration } from '../types';
import { IntegrationPickerContent, showsIntegrationForm } from './IntegrationPickerContent';
import type { IntegrationFormGuide } from './views/IntegrationFormView';

const anIntegration = (): Integration => ({
    active: true,
    name: 'BambooHR',
    provider: 'bamboohr',
    type: 'hris',
    version: '1.0.0',
    authentication_config_key: 'api_key',
    environment: 'production',
    integration_id: 'bamboohr-1',
    logo_url: 'https://example.com/bamboohr.png',
});

const aConnector = (): ConnectorConfig => ({
    key: 'bamboohr',
    name: 'BambooHR',
    type: 'custom',
    configFields: [],
});

const renderSelectedConnector = (guide?: IntegrationFormGuide) =>
    withMounted(
        <IntegrationPickerContent
            isLoading={false}
            hasError={false}
            connectionState={{ loading: false, success: false }}
            selectedIntegration={anIntegration()}
            connectorData={aConnector()}
            hubData={{ integrations: [anIntegration()] }}
            fields={[]}
            guide={guide}
            selectedCategory={null}
            search=""
            errorHubData={null}
            errorConnectorData={null}
            onSelect={() => undefined}
            onChange={() => undefined}
        />,
        (view) => {
            const toggle = view.container.querySelector('button[aria-expanded]');
            const text = view.text();
            if (toggle) {
                view.interact(() => clickOn(toggle));
            }
            return { text, toggle };
        },
    );

describe('#IntegrationPickerContent', () => {
    describe('when a guide is handed to the form view', () => {
        it('carries it through, so the form offers the toggle and the stacked guide', () => {
            // arrange
            const onToggle = vi.fn();

            // act
            const actual = renderSelectedConnector({
                shown: true,
                onToggle,
                stacked: <p>Stacked guide</p>,
            });

            // assert
            expect(actual.text).toContain('Stacked guide');
            expect(actual.text).toContain('Hide guide');
            expect(onToggle).toHaveBeenCalledTimes(1);
        });
    });

    describe('when no guide is handed over', () => {
        it('renders the form with no toggle', () => {
            // act
            const actual = renderSelectedConnector(undefined);

            // assert
            expect(actual.toggle).toBeNull();
            expect(actual.text).not.toContain('Hide guide');
        });
    });
});

describe('#showsIntegrationForm', () => {
    const base = {
        isLoading: false,
        hasError: false,
        connectionState: { loading: false, success: false },
        selectedIntegration: anIntegration(),
        connectorData: aConnector(),
    };

    it('is true only when nothing else is on screen', () => {
        // act
        const actual = [
            showsIntegrationForm(base),
            showsIntegrationForm({ ...base, isLoading: true }),
            showsIntegrationForm({ ...base, hasError: true }),
            showsIntegrationForm({ ...base, connectionState: { loading: true, success: false } }),
            showsIntegrationForm({ ...base, connectionState: { loading: false, success: true } }),
            showsIntegrationForm({ ...base, selectedIntegration: null }),
            showsIntegrationForm({ ...base, connectorData: null }),
        ];

        // assert
        expect(actual).toEqual([true, false, false, false, false, false, false]);
    });
});
