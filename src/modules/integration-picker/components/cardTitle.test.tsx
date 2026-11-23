import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ConnectorConfig } from '../types';
import { IntegrationPickerTitle } from './IntegrationPickerTitle';
import CardTitle from './cardTitle';

const connector = { key: 'ashby', name: 'Ashby', assets: {} } as unknown as ConnectorConfig;
const guide = { supportLink: 'https://docs.stackone.com/guides/ashby' };
const noop = () => undefined;

describe('CardTitle connection guide link', () => {
    it('shows the connection guide link by default', () => {
        const html = renderToStaticMarkup(<CardTitle connectorData={connector} guide={guide} />);

        expect(html).toContain('aria-label="Connection guide"');
        expect(html).toContain(guide.supportLink);
    });

    it('hides the connection guide link when showConnectionGuide is false', () => {
        const html = renderToStaticMarkup(
            <CardTitle connectorData={connector} guide={guide} showConnectionGuide={false} />,
        );

        expect(html).not.toContain('aria-label="Connection guide"');
        expect(html).not.toContain(guide.supportLink);
    });
});

describe('IntegrationPickerTitle connection guide link', () => {
    const render = (showConnectionGuide?: boolean) =>
        renderToStaticMarkup(
            <IntegrationPickerTitle
                connectorData={connector}
                accountData={null}
                onBack={noop}
                guide={guide}
                isLoading={false}
                hasError={false}
                hubData={null}
                selectedCategory={null}
                onCategoryChange={noop}
                onSearchChange={noop}
                showConnectionGuide={showConnectionGuide}
            />,
        );

    it('passes showConnectionGuide down to the connector header', () => {
        expect(render()).toContain('aria-label="Connection guide"');
        expect(render(false)).not.toContain('aria-label="Connection guide"');
    });
});
