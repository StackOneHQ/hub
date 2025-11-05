import { Card } from '@stackone/malachite';
import { useCallback } from 'react';
import useFeatureFlags from '../../shared/hooks/useFeatureFlags';
import { IntegrationPickerContent } from './components/IntegrationPickerContent';
import CardFooter from './components/cardFooter';
import CardTitle from './components/cardTitle';
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
}

export const IntegrationPicker: React.FC<IntegrationPickerProps> = ({
    token,
    baseUrl,
    height,
    accountId,
    onSuccess,
    dashboardUrl,
}) => {
    const isHubLinkAccountReleaseEnabled = useFeatureFlags('hub_link_account_release');

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
    };

    return (
        <Card
            footer={
                <CardFooter
                    selectedIntegration={selectedIntegration}
                    showActions={!connectionState.loading && !connectionState.success}
                    onBack={accountData ? undefined : onBack}
                    onNext={handleConnect}
                    isFormValid={isFormValid}
                />
            }
            title={
                selectedIntegration && (
                    <CardTitle
                        selectedIntegration={selectedIntegration}
                        onBack={accountData ? undefined : onBack}
                        guide={guide}
                    />
                )
            }
            height={height}
            padding="0"
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
                />
            )}
        </Card>
    );
};
