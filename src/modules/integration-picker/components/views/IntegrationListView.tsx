import React from 'react';
import { Integration } from '../../types';
import { IntegrationList } from '../IntegrationList';

interface IntegrationListViewProps {
    integrations: Integration[];
    onSelect: (integration: Integration) => void;
}

export const IntegrationListView: React.FC<IntegrationListViewProps> = ({
    integrations,
    onSelect,
}) => {
    if (!integrations.length) {
        return <div>No integrations found.</div>;
    }

    return <IntegrationList integrations={integrations} onSelect={onSelect} />;
};
