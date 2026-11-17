import { Button } from '@stackone/malachite';
import React from 'react';
import { AuthenticationNotice, ConnectorConfigField } from '../../types';
import { IntegrationForm } from '../IntegrationFields';

export interface IntegrationFormGuide {
    shown: boolean;
    onToggle: () => void;
    stacked?: React.ReactNode;
}

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
    connectorKey?: string;
    guide?: IntegrationFormGuide;
    editingSecrets?: Set<string>;
    setEditingSecrets?: (updater: (prev: Set<string>) => Set<string>) => void;
}

const columnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
};

const formColumnStyle: React.CSSProperties = { flex: '1 1 auto', minHeight: 0, overflow: 'auto' };

const toggleRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 16px 0',
};

export const IntegrationFormView: React.FC<IntegrationFormViewProps> = ({
    fields,
    notices,
    error,
    onChange,
    onValidationChange,
    integrationName,
    connectorKey,
    guide,
    editingSecrets,
    setEditingSecrets,
}) => {
    const form = (
        <IntegrationForm
            fields={fields}
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

    if (!guide) {
        return form;
    }

    return (
        <div style={columnStyle}>
            {guide.shown ? guide.stacked : null}
            <div style={formColumnStyle}>
                <div style={toggleRowStyle}>
                    <Button
                        variant="ghost"
                        size="small"
                        aria-expanded={guide.shown}
                        onClick={guide.onToggle}
                    >
                        {guide.shown ? 'Hide guide' : 'Show guide'}
                    </Button>
                </div>
                {form}
            </div>
        </div>
    );
};
