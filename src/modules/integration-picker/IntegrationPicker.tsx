import { Card } from '@stackone/malachite';
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

        // Errors
        errorHubData,
        errorConnectorData,

        // Actions
        setSelectedIntegration,
        setFormData,
        handleConnect,
        resetConnectionState,
    } = useIntegrationPicker({
        token,
        baseUrl,
        accountId,
        onSuccess,
        dashboardUrl,
    });

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
                    guide={guide}
                    errorHubData={errorHubData}
                    errorConnectorData={errorConnectorData}
                    onSelect={setSelectedIntegration}
                    onChange={setFormData}
                />
            )}
        </Card>
    );
};
