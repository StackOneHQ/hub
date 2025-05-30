import { useCallback, useMemo, useState } from 'react';
import { IntegrationForm } from './components/IntegrationFields';
import { IntegrationList } from './components/IntegrationList';
import { connectAccount, getConnectorConfig, getHubData } from './queries';
import { ConnectorConfig, ConnectorConfigField, HubData, Integration } from './types';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@stackone/malachite';
import { Loading } from '../../shared/components/loading';
import CardTitle from './components/cardTitle';
import CardFooter from './components/cardFooter';
import Success from '../../shared/components/success';

interface IntegrationPickerProps {
    token: string;
    baseUrl: string;
    height: string;
    onSuccess?: () => void;
    onClose?: () => void;
    onCancel?: () => void;
}

interface IntegrationPickerContentProps {
    isLoading: boolean;
    hasError: boolean;
    errorHubData: Error | null;
    errorConnectorData: Error | null;
    success: boolean;
    loading: boolean;
    selectedIntegration: Integration | null;
    connectorData: ConnectorConfig | null;
    hubData: HubData | null;
    fields: ConnectorConfigField[];
    error?: {
        message: string;
        provider_response: string;
    };
    guide?: { supportLink?: string; description: string };
    onSelect: (integration: Integration) => void;
    onChange: (data: Record<string, string>) => void;
}

const IntegrationPickerContent: React.FC<IntegrationPickerContentProps> = ({
    isLoading,
    hasError,
    errorHubData,
    errorConnectorData,
    success,
    loading,
    selectedIntegration,
    connectorData,
    hubData,
    fields,
    error,
    guide,
    onSelect,
    onChange,
}) => {
    if (isLoading) {
        return (
            <Loading
                title="Loading integration data"
                description="Please wait, this may take a moment."
            />
        );
    }

    if (hasError) {
        return <div>Error: {errorHubData?.message || errorConnectorData?.message}</div>;
    }

    if (success && selectedIntegration) {
        return <Success integrationName={selectedIntegration.name} />;
    }

    if (loading && selectedIntegration) {
        return (
            <Loading
                title={`Connecting to ${selectedIntegration.name}`}
                description="Please wait, this may take a moment."
            />
        );
    }

    if (!connectorData) {
        if (!hubData?.integrations.length) {
            return <div>No integrations found.</div>;
        }
        return <IntegrationList integrations={hubData.integrations} onSelect={onSelect} />;
    }

    if (selectedIntegration) {
        return <IntegrationForm fields={fields} error={error} onChange={onChange} guide={guide} />;
    }

    return null;
};

export const IntegrationPicker: React.FC<IntegrationPickerProps> = ({
    token,
    baseUrl,
    height,
    onSuccess,
}) => {
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<{
        message: string;
        provider_response: string;
    }>();
    const [success, setSuccess] = useState<boolean>(false);
    const [formData, setFormData] = useState<Record<string, string>>({});

    const {
        data: hubData,
        isLoading: isLoadingHubData,
        error: errorHubData,
    } = useQuery({
        queryKey: ['hubData'],
        queryFn: () => getHubData(token, baseUrl),
    });

    const {
        data: connectorData,
        isLoading: isLoadingConnectorData,
        error: errorConnectorData,
    } = useQuery({
        queryKey: ['connectorData', selectedIntegration?.provider],
        queryFn: () =>
            selectedIntegration
                ? getConnectorConfig(baseUrl, token, selectedIntegration.provider)
                : null,
        enabled: !!selectedIntegration,
    });

    const { fields, guide } = useMemo(() => {
        if (!connectorData || !selectedIntegration) {
            return { fields: [] };
        }

        const authConfig =
            connectorData.authentication?.[selectedIntegration.authentication_config_key];
        const authConfigForEnvironment = authConfig?.[selectedIntegration.environment];

        return {
            fields: authConfigForEnvironment?.fields || [],
            guide: authConfigForEnvironment?.guide,
        };
    }, [connectorData, selectedIntegration]);

    const handleConnect = useCallback(async () => {
        if (!selectedIntegration) return;

        setError(undefined);
        setLoading(true);

        try {
            await connectAccount(baseUrl, token, selectedIntegration.provider, formData);
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
            }, 2000);
        } catch (error) {
            const parsedError = JSON.parse((error as Error).message) as {
                status: number;
                message: string;
            };

            const doubleParsedError = JSON.parse(parsedError.message) as {
                message: string;
                provider_response: string;
            };

            setError({
                message: doubleParsedError.message,
                provider_response: doubleParsedError.provider_response,
            });
        } finally {
            setLoading(false);
        }
    }, [baseUrl, token, selectedIntegration, formData, onSuccess]);

    const isLoading = isLoadingHubData || isLoadingConnectorData;
    const hasError = !!(errorHubData || errorConnectorData);

    return (
        <Card
            footer={
                <CardFooter
                    selectedIntegration={selectedIntegration}
                    onBack={() => setSelectedIntegration(null)}
                    onNext={handleConnect}
                />
            }
            title={
                selectedIntegration && (
                    <CardTitle
                        selectedIntegration={selectedIntegration}
                        onBack={() => setSelectedIntegration(null)}
                        guide={guide}
                    />
                )
            }
            height={height}
        >
            <IntegrationPickerContent
                isLoading={isLoading}
                hasError={hasError}
                errorHubData={errorHubData}
                errorConnectorData={errorConnectorData}
                success={success}
                loading={loading}
                selectedIntegration={selectedIntegration}
                connectorData={connectorData ?? null}
                hubData={hubData ?? null}
                fields={fields}
                error={error}
                guide={guide}
                onSelect={setSelectedIntegration}
                onChange={setFormData}
            />
        </Card>
    );
};
