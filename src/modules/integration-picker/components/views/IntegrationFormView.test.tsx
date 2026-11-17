// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { clickOn, withMounted } from '../../../../shared/testing/clientRender';
import { ConnectorConfigField } from '../../types';
import { type IntegrationFormGuide, IntegrationFormView } from './IntegrationFormView';

const anApiKeyField = (): ConnectorConfigField => ({
    type: 'password',
    label: 'API Key',
    key: 'api_key',
    required: true,
    readOnly: false,
    secret: true,
    placeholder: 'Paste your key',
});

const renderView = <T,>(
    guide: IntegrationFormGuide | undefined,
    body: (view: Parameters<Parameters<typeof withMounted>[1]>[0]) => T,
): T =>
    withMounted(
        <IntegrationFormView
            fields={[anApiKeyField()]}
            connectorKey="bamboohr"
            guide={guide}
            onChange={() => undefined}
            integrationName="BambooHR"
        />,
        body,
    ) as T;

describe('#IntegrationFormView', () => {
    describe('when no guide is given', () => {
        it('renders the bare form with no toggle', () => {
            // act
            const actual = renderView(undefined, (view) => ({
                text: view.text(),
                toggle: view.container.querySelector('button[aria-expanded]'),
            }));

            // assert
            expect(actual.text).toContain('API Key');
            expect(actual.toggle).toBeNull();
        });
    });

    describe('when a guide is given', () => {
        it('labels the toggle from whether the guide is shown', () => {
            // act
            const actual = [true, false].map((shown) =>
                renderView({ shown, onToggle: () => undefined }, (view) => {
                    const toggle = view.container.querySelector('button[aria-expanded]');
                    return [toggle?.textContent, toggle?.getAttribute('aria-expanded')];
                }),
            );

            // assert
            expect(actual).toEqual([
                ['Hide guide', 'true'],
                ['Show guide', 'false'],
            ]);
        });

        it('calls onToggle when the toggle is pressed', () => {
            // arrange
            const onToggle = vi.fn();

            // act
            renderView({ shown: true, onToggle }, (view) => {
                view.interact(() => clickOn(view.button('Hide guide')));
            });

            // assert
            expect(onToggle).toHaveBeenCalledTimes(1);
        });

        it('renders the stacked node before the form when shown', () => {
            // act
            const actual = renderView(
                { shown: true, onToggle: () => undefined, stacked: <p>Stacked guide</p> },
                (view) => {
                    const stacked = view.container.querySelector('p');
                    const input = view.container.querySelector('input');
                    return Boolean(
                        stacked &&
                            input &&
                            stacked.compareDocumentPosition(input) &
                                Node.DOCUMENT_POSITION_FOLLOWING,
                    );
                },
            );

            // assert
            expect(actual).toBe(true);
        });

        it('leaves the stacked node out when hidden', () => {
            // act
            const actual = renderView(
                { shown: false, onToggle: () => undefined, stacked: <p>Stacked guide</p> },
                (view) => view.text(),
            );

            // assert
            expect(actual).not.toContain('Stacked guide');
            expect(actual).toContain('API Key');
        });
    });
});
