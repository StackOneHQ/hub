import React from 'react';
import { ConnectorConfigField } from '../../types';
import { IntegrationForm } from '../IntegrationFields';

interface IntegrationFormViewProps {
    fields: ConnectorConfigField[];
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
            error={error}
            onChange={onChange}
            onValidationChange={onValidationChange}
            integrationName={integrationName}
            editingSecrets={editingSecrets}
            setEditingSecrets={setEditingSecrets}
        />
    );
};
