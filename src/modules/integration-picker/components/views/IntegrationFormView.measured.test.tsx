import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ConnectorConfigField } from '../../types';
import { IntegrationFormView } from './IntegrationFormView';

const anApiKeyField = (): ConnectorConfigField => ({
    type: 'password',
    label: 'API Key',
    key: 'api_key',
    required: true,
    readOnly: false,
    secret: true,
    placeholder: 'Paste your key',
});

// Rendered the way a server-rendered host renders it: no DOM to read during render.
const renderOnServer = (withGuide: boolean) =>
    renderToString(
        <IntegrationFormView
            fields={[anApiKeyField()]}
            connectorKey="bamboohr"
            guide={withGuide ? { shown: true, onToggle: () => undefined } : undefined}
            onChange={() => undefined}
            integrationName="BambooHR"
        />,
    );

describe('#IntegrationFormView on the server', () => {
    it('renders the credential field with or without a guide', () => {
        // act
        const actual = [renderOnServer(false), renderOnServer(true)];

        // assert
        expect(actual[0]).toContain('API Key');
        expect(actual[1]).toContain('API Key');
    });
});
