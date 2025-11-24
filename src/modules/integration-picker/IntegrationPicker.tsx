import { Card } from '@stackone/malachite';
import { useCallback, useState } from 'react';
import useFeatureFlags from '../../shared/hooks/useFeatureFlags';
import { IntegrationPickerContent } from './components/IntegrationPickerContent';
import { IntegrationPickerTitle } from './components/IntegrationPickerTitle';
import CardFooter from './components/cardFooter';
import { useIntegrationPicker } from './hooks/useIntegrationPicker';

interface IntegrationPickerProps {
    token: string;
    baseUrl: string;
    height: string;
    accountId?: string;
    dashboardUrl?: string;
    onSuccess?: () => void;
    onClose?: () => void;
    onCancel?: () => void;
    showFooterLinks?: boolean;
}

export const IntegrationPicker: React.FC<IntegrationPickerProps> = ({
    token,
    baseUrl,
    height,
    accountId,
    onSuccess,
    dashboardUrl,
    showFooterLinks = true,
}) => {
    const isHubLinkAccountReleaseEnabled = useFeatureFlags('hub_link_account_release');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [search, setSearch] = useState<string>('');

    const {
        // Data
        hubData,
        accountData,
        connectorData,
        selectedIntegration,
        fields,
        guide,

        // State
        connectionState,
        isLoading,
        hasError,
        isFormValid,

        // Errors
        errorHubData,
        errorConnectorData,

        // Actions
        setSelectedIntegration,
        setFormData,
        setIsFormValid,
        handleConnect,
        resetConnectionState,
        editingSecrets,
        setEditingSecrets,
    } = useIntegrationPicker({
        token,
        baseUrl,
        accountId,
        onSuccess,
        dashboardUrl,
    });

    const handleValidationChange = useCallback(
        (isValid: boolean) => {
            setIsFormValid(isValid);
        },
        [setIsFormValid],
    );

    const onBack = () => {
        setSelectedIntegration(null);
        resetConnectionState();
        setSelectedCategory(null);
        setSearch('');
    };

    return (
        <Card
            glassFooter
            footer={
                <CardFooter
                    selectedIntegration={selectedIntegration}
                    showActions={!connectionState.loading && !connectionState.success}
                    onBack={accountData ? undefined : onBack}
                    onNext={handleConnect}
                    isFormValid={isFormValid}
                    showFooterLinks={showFooterLinks}
                />
            }
            title={
                <IntegrationPickerTitle
                    selectedIntegration={selectedIntegration}
                    accountData={accountData}
                    onBack={onBack}
                    guide={guide}
                    isLoading={isLoading}
                    hasError={hasError}
                    hubData={hubData}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    onSearchChange={setSearch}
                    hideBackButton={connectionState.loading || connectionState.success}
                />
            }
            height={height}
            padding="0"
            headerConfig={
                selectedIntegration
                    ? undefined
                    : {
                          padding: '0',
                      }
            }
        >
            {isHubLinkAccountReleaseEnabled && (
                <IntegrationPickerContent
                    isLoading={isLoading}
                    hasError={hasError}
                    connectionState={connectionState}
                    selectedIntegration={selectedIntegration}
                    connectorData={connectorData?.config ?? null}
                    hubData={hubData ?? null}
                    fields={fields}
                    errorHubData={(errorHubData as Error) ?? null}
                    errorConnectorData={(errorConnectorData as Error) ?? null}
                    onSelect={setSelectedIntegration}
                    onChange={setFormData}
                    onValidationChange={handleValidationChange}
                    selectedCategory={selectedCategory}
                    search={search}
                    editingSecrets={editingSecrets}
                    setEditingSecrets={setEditingSecrets}
                />
            )}
        </Card>
    );
};
