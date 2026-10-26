import { Flex, FlexAlign, FlexDirection, FlexJustify } from '@stackone/malachite';
import { ConnectorConfig, ConnectorProfile, HubData } from '../types';
import { profileOptions } from '../utils/profileOptions';
import CardTitle from './cardTitle';
import { HeaderCloseButton } from './headerCloseButton';
import { IntegrationListHeader } from './views/IntegrationListView';

interface IntegrationPickerTitleProps {
    connectorData: ConnectorConfig | null;
    accountData: unknown;
    onBack: () => void;
    onClose?: () => void;
    guide?: { supportLink?: string | null; description?: string | null };
    isLoading: boolean;
    hasError: boolean;
    hubData: HubData | null | undefined;
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    onSearchChange: (search: string) => void;
    hideBackButton?: boolean;
    profiles?: ConnectorProfile[];
    selectedProfileId?: string;
    onProfileChange?: (integrationId: string) => void;
}

export const IntegrationPickerTitle: React.FC<IntegrationPickerTitleProps> = ({
    connectorData,
    accountData,
    onBack,
    onClose,
    guide,
    isLoading,
    hasError,
    hubData,
    selectedCategory,
    onCategoryChange,
    onSearchChange,
    hideBackButton,
    profiles,
    selectedProfileId,
    onProfileChange,
}) => {
    if (connectorData) {
        return (
            <CardTitle
                connectorData={connectorData}
                onBack={accountData || hideBackButton ? undefined : onBack}
                onClose={onClose}
                guide={guide}
                profileOptions={profileOptions(profiles)}
                selectedProfileId={selectedProfileId}
                onProfileChange={onProfileChange}
            />
        );
    }

    const shouldShowListHeader = !isLoading && !hasError && hubData?.integrations;

    if (!shouldShowListHeader) {
        return onClose ? (
            <Flex
                direction={FlexDirection.Horizontal}
                align={FlexAlign.Center}
                justify={FlexJustify.Right}
            >
                <div style={{ padding: '0 12px 0 8px' }}>
                    <HeaderCloseButton onClick={onClose} />
                </div>
            </Flex>
        ) : null;
    }

    return (
        <IntegrationListHeader
            integrations={hubData.integrations}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            onSearchChange={onSearchChange}
            onClose={onClose}
        />
    );
};
