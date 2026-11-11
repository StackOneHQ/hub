import React from 'react';
import {
    AuthenticationNotice,
    ConnectorConfig,
    ConnectorConfigField,
    ConnectorProfile,
    HubData,
    Integration,
} from '../types';
import { describeLoadError } from '../utils/requestErrors';
import { ProfilePicker } from './ProfilePicker';
import { ErrorView } from './views/ErrorView';
import { IntegrationFormView } from './views/IntegrationFormView';
import { IntegrationListView } from './views/IntegrationListView';
import { LoadingView } from './views/LoadingView';
import { SuccessView } from './views/SuccessView';

// The picker sits outside the keyed form so a profile switch does not remount it and drop its focus.
const FORM_LAYOUT_STYLE: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
};

const FORM_REGION_STYLE: React.CSSProperties = { flex: 1, minHeight: 0 };

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
    profiles?: ConnectorProfile[];
    notices?: AuthenticationNotice[];
    selectedCategory: string | null;
    search: string;

    // Errors
    loadError: unknown;

    // Actions
    onRetryLoad: () => void;
    onSelect: (integration: Integration) => void;
    onChange: (data: Record<string, string>) => void;
    onValidationChange?: (isValid: boolean) => void;
    onCancelOAuth?: () => void;
    onProfileChange: (integrationId: string) => void;
    editingSecrets?: Set<string>;
    setEditingSecrets?: (updater: (prev: Set<string>) => Set<string>) => void;
}

export const IntegrationPickerContent: React.FC<IntegrationPickerContentProps> = ({
    isLoading,
    hasError,
    connectionState,
    selectedIntegration,
    connectorData,
    hubData,
    fields,
    profiles,
    notices,
    selectedCategory,
    search,
    loadError,
    onRetryLoad,
    onSelect,
    onChange,
    onValidationChange,
    onCancelOAuth,
    onProfileChange,
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
        const { title, message, retryable } = describeLoadError(loadError);
        return (
            <ErrorView
                title={title}
                message={message}
                onRetry={retryable ? onRetryLoad : undefined}
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
    if (connectorData) {
        return (
            <div style={FORM_LAYOUT_STYLE}>
                <ProfilePicker
                    profiles={profiles}
                    selectedProfileId={selectedIntegration.integration_id}
                    onProfileChange={onProfileChange}
                />
                <div style={FORM_REGION_STYLE}>
                    <IntegrationFormView
                        key={selectedIntegration.integration_id}
                        fields={fields}
                        notices={notices}
                        error={connectionState.error}
                        onChange={onChange}
                        onValidationChange={onValidationChange}
                        integrationName={connectorData.name}
                        connectorKey={connectorData.key}
                        editingSecrets={editingSecrets}
                        setEditingSecrets={setEditingSecrets}
                    />
                </div>
            </div>
        );
    }

    // Fallback
    return null;
};
