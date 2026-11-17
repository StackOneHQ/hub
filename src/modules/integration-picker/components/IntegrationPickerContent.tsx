import React from 'react';
import {
    AuthenticationNotice,
    ConnectorConfig,
    ConnectorConfigField,
    HubData,
    Integration,
} from '../types';
import { ErrorView } from './views/ErrorView';
import { IntegrationFormGuide, IntegrationFormView } from './views/IntegrationFormView';
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
    notices?: AuthenticationNotice[];
    guide?: IntegrationFormGuide;
    selectedCategory: string | null;
    search: string;

    // Errors
    errorHubData: Error | null;
    errorConnectorData: Error | null;

    // Actions
    onSelect: (integration: Integration) => void;
    onChange: (data: Record<string, string>) => void;
    onValidationChange?: (isValid: boolean) => void;
    onCancelOAuth?: () => void;
    editingSecrets?: Set<string>;
    setEditingSecrets?: (updater: (prev: Set<string>) => Set<string>) => void;
}

interface FormVisibilityState {
    isLoading: boolean;
    hasError: boolean;
    connectionState: { loading: boolean; success: boolean };
    selectedIntegration: Integration | null;
    connectorData: ConnectorConfig | null;
}

/** Whether the credential form is the view on screen, in the order the content chooses its views. */
export const showsIntegrationForm = ({
    isLoading,
    hasError,
    connectionState,
    selectedIntegration,
    connectorData,
}: FormVisibilityState): boolean =>
    !isLoading &&
    !hasError &&
    !connectionState.loading &&
    !connectionState.success &&
    selectedIntegration !== null &&
    connectorData !== null;

export const IntegrationPickerContent: React.FC<IntegrationPickerContentProps> = ({
    isLoading,
    hasError,
    connectionState,
    selectedIntegration,
    connectorData,
    hubData,
    fields,
    notices,
    guide,
    selectedCategory,
    search,
    errorHubData,
    errorConnectorData,
    onSelect,
    onChange,
    onValidationChange,
    onCancelOAuth,
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
                onCancel={onCancelOAuth}
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

    // Integration selection flow
    if (!selectedIntegration) {
        if (!hubData?.integrations.length) {
            return <ErrorView message="No configured integrations available." />;
        }
        return (
            <IntegrationListView
                integrations={hubData.integrations}
                onSelect={onSelect}
                selectedCategory={selectedCategory}
                search={search}
            />
        );
    }

    // Form view (when integration is selected and connector data is available)
    if (
        connectorData &&
        showsIntegrationForm({
            isLoading,
            hasError,
            connectionState,
            selectedIntegration,
            connectorData,
        })
    ) {
        return (
            <IntegrationFormView
                key={selectedIntegration?.integration_id}
                fields={fields}
                notices={notices}
                guide={guide}
                error={connectionState.error}
                onChange={onChange}
                onValidationChange={onValidationChange}
                integrationName={connectorData.name}
                connectorKey={connectorData.key}
                editingSecrets={editingSecrets}
                setEditingSecrets={setEditingSecrets}
            />
        );
    }

    // Fallback
    return null;
};
