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
}

export const IntegrationFormView: React.FC<IntegrationFormViewProps> = ({
    fields,
    error,
    onChange,
}) => {
    return <IntegrationForm fields={fields} error={error} onChange={onChange} />;
};
