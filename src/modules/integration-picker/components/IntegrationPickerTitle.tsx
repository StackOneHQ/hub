import { Button, Typography } from '@stackone/malachite';
import { ConnectorConfig, HubData, Integration } from '../types';
import CardTitle from './cardTitle';
import { IntegrationListHeader } from './views/IntegrationListView';

interface IntegrationPickerTitleProps {
    connectorData: ConnectorConfig | null;
    accountData: unknown;
    onBack: () => void;
    guide?: { supportLink?: string | null; description?: string | null };
    isLoading: boolean;
    hasError: boolean;
    hubData: HubData | null | undefined;
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    onSearchChange: (search: string) => void;
    hideBackButton?: boolean;
    selectedProvider: string | null;
    hasOnlyOneProvider: boolean;
    uniqueProviderIntegrations: Integration[];
}

export const IntegrationPickerTitle: React.FC<IntegrationPickerTitleProps> = ({
    connectorData,
    accountData,
    onBack,
    guide,
    isLoading,
    hasError,
    hubData,
    selectedCategory,
    onCategoryChange,
    onSearchChange,
    hideBackButton,
    selectedProvider,
    hasOnlyOneProvider,
    uniqueProviderIntegrations,
}) => {
    if (connectorData) {
        return (
            <CardTitle
                connectorData={connectorData}
                onBack={accountData || hideBackButton ? undefined : onBack}
                guide={guide}
            />
        );
    }

    if (selectedProvider) {
        const showBackButton = !hasOnlyOneProvider && !accountData;
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'flex-start',
                }}
            >
                {showBackButton && (
                    <Button variant="ghost" onClick={onBack} icon="←" size="small" />
                )}
                <Typography.Text fontWeight="semi-bold" size="medium">
                    Select Auth Config
                </Typography.Text>
            </div>
        );
    }

    const shouldShowListHeader = !isLoading && !hasError && hubData?.integrations;

    if (!shouldShowListHeader) {
        return null;
    }

    return (
        <IntegrationListHeader
            integrations={uniqueProviderIntegrations}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            onSearchChange={onSearchChange}
        />
    );
};
