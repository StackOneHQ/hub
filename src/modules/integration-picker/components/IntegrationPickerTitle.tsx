import { HubData, Integration } from '../types';
import CardTitle from './cardTitle';
import { IntegrationListHeader } from './views/IntegrationListView';

interface IntegrationPickerTitleProps {
    selectedIntegration: Integration | null;
    accountData: unknown;
    onBack: () => void;
    guide?: { supportLink?: string; description: string };
    isLoading: boolean;
    hasError: boolean;
    hubData: HubData | null | undefined;
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    onSearchChange: (search: string) => void;
    hideBackButton?: boolean;
}

export const IntegrationPickerTitle: React.FC<IntegrationPickerTitleProps> = ({
    selectedIntegration,
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
}) => {
    if (selectedIntegration) {
        return (
            <CardTitle
                selectedIntegration={selectedIntegration}
                onBack={accountData || hideBackButton ? undefined : onBack}
                guide={guide}
            />
        );
    }

    const shouldShowListHeader = !isLoading && !hasError && hubData?.integrations;

    if (!shouldShowListHeader) {
        return null;
    }

    return (
        <IntegrationListHeader
            integrations={hubData.integrations}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            onSearchChange={onSearchChange}
        />
    );
};
