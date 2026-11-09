import React from 'react';
import { AuthenticationNotice, ConnectorConfigField } from '../../types';
import { IntegrationForm } from '../IntegrationFields';

interface IntegrationFormViewProps {
    fields: ConnectorConfigField[];
    profilePicker?: React.ReactNode;
    notices?: AuthenticationNotice[];
    error?: {
        message: string;
        provider_response: string;
    };
    onChange: (data: Record<string, string>) => void;
    onValidationChange?: (isValid: boolean) => void;
    integrationName: string;
    connectorKey?: string;
    editingSecrets?: Set<string>;
    setEditingSecrets?: (updater: (prev: Set<string>) => Set<string>) => void;
}

export const IntegrationFormView: React.FC<IntegrationFormViewProps> = ({
    fields,
    profilePicker,
    notices,
    error,
    onChange,
    onValidationChange,
    integrationName,
    connectorKey,
    editingSecrets,
    setEditingSecrets,
}) => {
    return (
        <IntegrationForm
            fields={fields}
            profilePicker={profilePicker}
            notices={notices}
            error={error}
            onChange={onChange}
            onValidationChange={onValidationChange}
            integrationName={integrationName}
            connectorKey={connectorKey}
            editingSecrets={editingSecrets}
            setEditingSecrets={setEditingSecrets}
        />
    );
};
