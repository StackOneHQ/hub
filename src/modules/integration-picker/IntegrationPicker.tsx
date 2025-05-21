import { useEffect, useState } from 'react';
import { IntegrationForm } from './components/IntegrationFields';
import { IntegrationSelector } from './components/IntegrationSelector';
import { getConnectorConfig, getHubData } from './queries';
import { ConnectorConfig, HubData, Integration } from './types';

interface IntegrationPickerProps {
    token: string;
    baseUrl: string;
}

export const IntegrationPicker: React.FC<IntegrationPickerProps> = ({ token, baseUrl }) => {
    const [hubData, setHubData] = useState<HubData>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [connectorData, setConnectorData] = useState<ConnectorConfig>();
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

    useEffect(() => {
        const loadHubData = async () => {
            try {
                setIsLoading(true);
                const hubData = await getHubData(token, baseUrl);
                console.log('Hub Data:', hubData);
                setHubData(hubData);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        loadHubData();
    }, [token, baseUrl]);

    useEffect(() => {
        if (selectedIntegration) {
            const loadConnectorConfig = async () => {
                try {
                    const connectorConfig = await getConnectorConfig(
                        baseUrl,
                        token,
                        selectedIntegration.provider,
                    );
                    setConnectorData(connectorConfig);
                } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            };
            loadConnectorConfig();
        }
    }, [selectedIntegration, token, baseUrl]);

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '0px 200px' }}>
            {!connectorData && (
                <IntegrationSelector
                    integrations={hubData?.integrations || []}
                    onSelect={setSelectedIntegration}
                />
            )}
            {!connectorData && hubData && hubData.integrations.length === 0 && (
                <div>No integrations found.</div>
            )}
            {connectorData && selectedIntegration && (
                <IntegrationForm
                    integration={selectedIntegration}
                    token={token}
                    baseUrl={baseUrl}
                    connectorConfig={connectorData}
                />
            )}
        </div>
    );
};
