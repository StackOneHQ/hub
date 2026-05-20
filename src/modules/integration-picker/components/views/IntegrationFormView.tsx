import React from 'react';
import { AuthenticationNotice, ConnectorConfigField } from '../../types';
import { IntegrationForm } from '../IntegrationFields';

interface IntegrationFormViewProps {
    fields: ConnectorConfigField[];
    notices?: AuthenticationNotice[];
    error?: {
        message: string;
        provider_response: string;
    };
    onChange: (data: Record<string, string>) => void;
    onValidationChange?: (isValid: boolean) => void;
    integrationName: string;
    editingSecrets?: Set<string>;
    setEditingSecrets?: (updater: (prev: Set<string>) => Set<string>) => void;
}

export const IntegrationFormView: React.FC<IntegrationFormViewProps> = ({
    fields,
    notices,
    error,
    onChange,
    onValidationChange,
    integrationName,
    editingSecrets,
    setEditingSecrets,
}) => {
    return (
        <IntegrationForm
            fields={fields}
            notices={notices}
            error={error}
            onChange={onChange}
            onValidationChange={onValidationChange}
            integrationName={integrationName}
            editingSecrets={editingSecrets}
            setEditingSecrets={setEditingSecrets}
        />
    );
};
