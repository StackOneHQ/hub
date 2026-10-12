import React from 'react';
import { AuthenticationNotice, ConnectorConfigField } from '../../types';
import { IntegrationForm } from '../IntegrationFields';

interface IntegrationFormViewProps {
    fields: ConnectorConfigField[];
    notices?: AuthenticationNotice[];
    linkedAtSignIn?: boolean;
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
    notices,
    linkedAtSignIn,
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
            notices={notices}
            linkedAtSignIn={linkedAtSignIn}
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
