import React from 'react';
import { ConnectorConfig, ConnectorConfigField, HubData, Integration } from '../types';
import { ErrorView } from './views/ErrorView';
import { IntegrationFormView } from './views/IntegrationFormView';
import { IntegrationListView } from './views/IntegrationListView';
import { LoadingView } from './views/LoadingView';
import { SuccessView } from './views/SuccessView';

interface IntegrationPickerContentProps {
    // State flags
    isLoading: boolean;
    hasError: boolean;
    connectionState: {
        loading: boolean;
        success: boolean;
        error?: {
            message: string;
            provider_response: string;
        };
    };

    // Data
    selectedIntegration: Integration | null;
    connectorData: ConnectorConfig | null;
    hubData: HubData | null;
    fields: ConnectorConfigField[];

    // Errors
    errorHubData: Error | null;
    errorConnectorData: Error | null;

    // Actions
    onSelect: (integration: Integration) => void;
    onChange: (data: Record<string, string>) => void;
}

export const IntegrationPickerContent: React.FC<IntegrationPickerContentProps> = ({
    isLoading,
    hasError,
    connectionState,
    selectedIntegration,
    connectorData,
    hubData,
    fields,
    errorHubData,
    errorConnectorData,
    onSelect,
    onChange,
}) => {
    // Loading states
    if (isLoading) {
        return (
            <LoadingView
                title="Loading integration data"
                description="Please wait, this may take a moment."
            />
        );
    }

    if (connectionState.loading && selectedIntegration) {
        return (
            <LoadingView
                title={`Connecting to ${selectedIntegration.name}`}
                description="Please wait, this may take a moment."
            />
        );
    }

    // Error states
    if (hasError) {
        return (
            <ErrorView
                message={errorHubData?.message || errorConnectorData?.message || 'Unknown error'}
            />
        );
    }

    // Success state
    if (connectionState.success && selectedIntegration) {
        return <SuccessView integrationName={selectedIntegration.name} />;
    }

    // Integration selection flow
    if (!selectedIntegration) {
        if (!hubData?.integrations.length) {
            return <ErrorView message="No integrations found." />;
        }
        return <IntegrationListView integrations={hubData.integrations} onSelect={onSelect} />;
    }

    // Form view (when integration is selected and connector data is available)
    if (connectorData) {
        return (
            <IntegrationFormView
                fields={fields}
                error={connectionState.error}
                onChange={onChange}
            />
        );
    }

    // Fallback
    return null;
};
