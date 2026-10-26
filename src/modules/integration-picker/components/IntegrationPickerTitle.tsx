import { Flex, FlexAlign, FlexDirection, FlexJustify, Padded } from '@stackone/malachite';
import { ConnectorConfig, ConnectorProfile, HubData } from '../types';
import { profileOptions } from '../utils/profileOptions';
import { CancelButton } from './cancelButton';
import CardTitle from './cardTitle';
import { IntegrationListHeader } from './views/IntegrationListView';

interface IntegrationPickerTitleProps {
    connectorData: ConnectorConfig | null;
    accountData: unknown;
    onBack: () => void;
    onCancel?: () => void;
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
    onCancel,
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
                onCancel={onCancel}
                guide={guide}
                profileOptions={profileOptions(profiles)}
                selectedProfileId={selectedProfileId}
                onProfileChange={onProfileChange}
            />
        );
    }

    const shouldShowListHeader = !isLoading && !hasError && hubData?.integrations;

    if (!shouldShowListHeader) {
        // A failed hub or connector load has no header of its own; the close still has to be
        // somewhere, so it stands alone where the list's would have put it.
        return onCancel ? (
            <Flex
                direction={FlexDirection.Horizontal}
                align={FlexAlign.Center}
                justify={FlexJustify.Right}
            >
                <Padded vertical="none" horizontal="small" fullHeight={false}>
                    <CancelButton onClick={onCancel} />
                </Padded>
            </Flex>
        ) : null;
    }

    return (
        <IntegrationListHeader
            integrations={hubData.integrations}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            onSearchChange={onSearchChange}
            onCancel={onCancel}
        />
    );
};
