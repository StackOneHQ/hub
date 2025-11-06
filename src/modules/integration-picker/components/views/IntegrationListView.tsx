import React from 'react';
import { Integration } from '../../types';
import { IntegrationList, IntegrationListHeader } from '../IntegrationList';

interface IntegrationListViewProps {
    integrations: Integration[];
    onSelect: (integration: Integration) => void;
    selectedCategory: string | null;
    search: string;
}

export const IntegrationListView: React.FC<IntegrationListViewProps> = ({
    integrations,
    onSelect,
    selectedCategory,
    search,
}) => {
    if (!integrations.length) {
        return <div>No integrations found.</div>;
    }

    return (
        <IntegrationList
            integrations={integrations}
            onSelect={onSelect}
            selectedCategory={selectedCategory}
            search={search}
        />
    );
};

export { IntegrationListHeader };
