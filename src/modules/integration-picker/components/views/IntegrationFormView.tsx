import React from 'react';
import { ConnectorConfigField } from '../../types';
import { IntegrationForm } from '../IntegrationFields';

interface IntegrationFormViewProps {
    fields: ConnectorConfigField[];
    error?: {
        message: string;
        provider_response: string;
    };
    guide?: { supportLink?: string; description: string };
    onChange: (data: Record<string, string>) => void;
}

export const IntegrationFormView: React.FC<IntegrationFormViewProps> = ({
    fields,
    error,
    guide,
    onChange,
}) => {
    return <IntegrationForm fields={fields} error={error} onChange={onChange} guide={guide} />;
};
