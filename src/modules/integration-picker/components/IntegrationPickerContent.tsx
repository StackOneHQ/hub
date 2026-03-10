import React from 'react';
import { ConnectorConfig, ConnectorConfigField, HubData, Integration } from '../types';
import { AuthConfigSelectionView } from './views/AuthConfigSelectionView';
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
    selectedProvider: string | null;
    uniqueProviderIntegrations: Integration[];
    providerIntegrations: Integration[];
    connectorData: ConnectorConfig | null;
    hubData: HubData | null;
    fields: ConnectorConfigField[];
    selectedCategory: string | null;
    search: string;

    // Errors
    errorHubData: Error | null;
    errorConnectorData: Error | null;

    // Actions
    onProviderSelect: (integration: Integration) => void;
    onAuthConfigSelect: (integration: Integration) => void;
    onCreateNewAuthConfig?: () => void;
    onChange: (data: Record<string, string>) => void;
    onValidationChange?: (isValid: boolean) => void;
    editingSecrets?: Set<string>;
    setEditingSecrets?: (updater: (prev: Set<string>) => Set<string>) => void;
}

export const IntegrationPickerContent: React.FC<IntegrationPickerContentProps> = ({
    isLoading,
    hasError,
    connectionState,
    selectedIntegration,
    selectedProvider,
    uniqueProviderIntegrations,
    providerIntegrations,
    connectorData,
    hubData,
    fields,
    selectedCategory,
    search,
    errorHubData,
    errorConnectorData,
    onProviderSelect,
    onAuthConfigSelect,
    onCreateNewAuthConfig,
    onChange,
    onValidationChange,
    editingSecrets,
    setEditingSecrets,
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
                title={`Connecting to ${connectorData?.name ?? selectedIntegration.name}`}
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
        return <SuccessView integrationName={connectorData?.name ?? selectedIntegration.name} />;
    }

    // Form view (when auth config is selected and connector data is available)
    if (selectedIntegration && connectorData) {
        return (
            <IntegrationFormView
                fields={fields}
                error={connectionState.error}
                onChange={onChange}
                onValidationChange={onValidationChange}
                integrationName={connectorData.name}
                editingSecrets={editingSecrets}
                setEditingSecrets={setEditingSecrets}
            />
        );
    }

    // Auth Config selection (provider selected, auth config not yet selected)
    if (selectedProvider && !selectedIntegration) {
        return (
            <AuthConfigSelectionView
                integrations={providerIntegrations}
                onSelect={onAuthConfigSelect}
                onCreateNew={onCreateNewAuthConfig}
            />
        );
    }

    // Provider/Connector selection
    if (!hubData?.integrations.length) {
        return <ErrorView message="No configured integrations available." />;
    }
    return (
        <IntegrationListView
            integrations={uniqueProviderIntegrations}
            onSelect={onProviderSelect}
            selectedCategory={selectedCategory}
            search={search}
        />
    );
};
