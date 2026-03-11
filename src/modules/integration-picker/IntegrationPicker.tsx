import { Card } from '@stackone/malachite';
import { useCallback, useMemo, useState } from 'react';
import useFeatureFlags from '../../shared/hooks/useFeatureFlags';
import { IntegrationPickerContent } from './components/IntegrationPickerContent';
import { IntegrationPickerTitle } from './components/IntegrationPickerTitle';
import CardFooter from './components/cardFooter';
import SuccessCardFooter from './components/successCardFooter';
import { useIntegrationPicker } from './hooks/useIntegrationPicker';

interface IntegrationPickerProps {
    token: string;
    baseUrl: string;
    height: string;
    accountId?: string;
    dashboardUrl?: string;
    onSuccess?: (account: { id: string; provider: string }) => void;
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
    onClose,
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
        selectedProvider,
        uniqueProviderIntegrations,
        providerIntegrations,
        hasOnlyOneProvider,
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
        setSelectedProvider,
        setSelectedVersion,
        handleProviderSelect,
        handleCreateNewAuthConfig,
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

    const hasOnlyOneIntegration = useMemo(() => {
        if (!hubData) return false;
        const activeIntegrations = hubData.integrations.filter((integration) => integration.active);
        return activeIntegrations.length === 1;
    }, [hubData]);

    const onBack = () => {
        if (selectedIntegration) {
            // From form to auth config selection
            setSelectedIntegration(null);
            resetConnectionState();
        } else if (selectedProvider) {
            // From auth config selection to provider list
            setSelectedProvider(null);
            setSelectedVersion(null);
            setSelectedCategory(null);
            setSearch('');
        }
    };

    return (
        <Card
            glassFooter
            footer={
                connectionState.success ? (
                    <SuccessCardFooter
                        onClose={() => onClose?.()}
                        showFooterLinks={showFooterLinks}
                    />
                ) : (
                    <CardFooter
                        selectedIntegration={selectedIntegration}
                        showActions={!connectionState.loading && !connectionState.success}
                        onBack={accountData || hasOnlyOneIntegration ? undefined : onBack}
                        onNext={handleConnect}
                        isFormValid={isFormValid}
                        showFooterLinks={showFooterLinks}
                    />
                )
            }
            title={
                isLoading || connectionState.loading || connectionState.success ? null : (
                    <IntegrationPickerTitle
                        accountData={accountData}
                        onBack={onBack}
                        guide={guide}
                        isLoading={isLoading}
                        hasError={hasError}
                        hubData={hubData}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        onSearchChange={setSearch}
                        hideBackButton={
                            connectionState.loading ||
                            connectionState.success ||
                            hasOnlyOneIntegration
                        }
                        connectorData={connectorData?.config ?? null}
                        selectedProvider={selectedProvider}
                        hasOnlyOneProvider={hasOnlyOneProvider}
                        uniqueProviderIntegrations={uniqueProviderIntegrations}
                    />
                )
            }
            height={height}
            padding="0"
            headerConfig={
                selectedIntegration || selectedProvider
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
                    selectedProvider={selectedProvider}
                    uniqueProviderIntegrations={uniqueProviderIntegrations}
                    providerIntegrations={providerIntegrations}
                    connectorData={connectorData?.config ?? null}
                    hubData={hubData ?? null}
                    fields={fields}
                    errorHubData={(errorHubData as Error) ?? null}
                    errorConnectorData={(errorConnectorData as Error) ?? null}
                    onProviderSelect={handleProviderSelect}
                    onAuthConfigSelect={setSelectedIntegration}
                    onCreateNewAuthConfig={dashboardUrl ? handleCreateNewAuthConfig : undefined}
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
