import { evaluate } from '@stackone/expressions';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    connectAccount,
    getAccountData,
    getConnectorConfig,
    getHubData,
    updateAccount,
} from '../queries';
import { ConnectorConfigField, Integration } from '../types';

const DUMMY_VALUE = 'totally-fake-value';

interface UseIntegrationPickerProps {
    token: string;
    baseUrl: string;
    accountId?: string;
    onSuccess?: () => void;
    dashboardUrl?: string;
}

export enum EventType {
    AccountConnected = 'AccountConnected',
    CloseModal = 'CloseModal',
    CloseOAuth2 = 'CloseOAuth2',
}

export const useIntegrationPicker = ({
    token,
    baseUrl,
    accountId,
    onSuccess,
    dashboardUrl,
}: UseIntegrationPickerProps) => {
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const connectWindow = useRef<Window | null>(null);
    const [connectionState, setConnectionState] = useState<{
        loading: boolean;
        success: boolean;
        error?: {
            message: string;
            provider_response: string;
        };
    }>({
        loading: false,
        success: false,
    });

    const processMessageCallback = (event: MessageEvent) => {
        console.log('processMessageCallback', event);
        // if (event.origin !== location.origin) {
        //     console.log('origin does not match', event.origin, location.origin);
        //     return;
        // }

        if (event.data.type === EventType.AccountConnected) {
            console.log('account connected');
            setConnectionState({ loading: false, success: true });
            parent.postMessage(event.data, '*');
            connectWindow.current && connectWindow.current.close();
            connectWindow.current = null;
            window.removeEventListener('message', processMessageCallback, false);
        } else if (event.data.type === EventType.CloseOAuth2) {
            console.log('close oauth2');
            if (event.data.error) {
                setConnectionState({
                    loading: false,
                    success: false,
                    error: {
                        message: event.data.error,
                        provider_response: event.data.errorDescription,
                    },
                });
                connectWindow.current && connectWindow.current.close();
                connectWindow.current = null;
                window.removeEventListener('message', processMessageCallback, false);
            } else {
                setConnectionState({ loading: false, success: false, error: undefined });
                connectWindow.current && connectWindow.current.close();
                connectWindow.current = null;
                window.removeEventListener('message', processMessageCallback, false);
            }
        }
    };

    // Fetch account data for editing scenario
    const {
        data: accountData,
        isLoading: isLoadingAccountData,
        error: errorAccountData,
    } = useQuery({
        queryKey: ['accountData', accountId],
        queryFn: async () => {
            if (!accountId) return null;
            return getAccountData(baseUrl, token, accountId);
        },
        enabled: !!accountId,
    });

    // Fetch hub data (list of integrations)
    const {
        data: hubData,
        isLoading: isLoadingHubData,
        error: errorHubData,
    } = useQuery({
        queryKey: ['hubData', accountData?.provider],
        queryFn: () => {
            // For account editing: fetch hub data with specific provider
            if (accountData?.provider) {
                return getHubData(token, baseUrl, accountData.provider);
            }
            // For new setup: fetch all integrations
            return getHubData(token, baseUrl);
        },
        enabled: !accountId || !!accountData, // Enable when no accountId OR when we have account data
    });

    // Auto-select integration when editing an account
    useEffect(() => {
        if (accountData && hubData) {
            const matchingIntegration = hubData.integrations.find(
                (integration) => integration.provider === accountData.provider,
            );
            setSelectedIntegration(matchingIntegration ?? null);
        }
    }, [accountData, hubData]);

    // Fetch connector configuration
    const {
        data: connectorData,
        isLoading: isLoadingConnectorData,
        error: errorConnectorData,
    } = useQuery({
        queryKey: ['connectorData', selectedIntegration?.provider, accountData?.provider],
        queryFn: async () => {
            if (selectedIntegration) {
                return getConnectorConfig(baseUrl, token, selectedIntegration.provider);
            }
            if (accountData) {
                return getConnectorConfig(baseUrl, token, accountData.provider);
            }
            return null;
        },
        enabled: Boolean(selectedIntegration) || Boolean(accountData),
    });

    // Extract fields and guide from connector config
    const { fields, guide } = useMemo(() => {
        if (!connectorData || !selectedIntegration) {
            const fields: ConnectorConfigField[] = [];
            return { fields };
        }

        const authConfig =
            connectorData.config.authentication?.[selectedIntegration.authentication_config_key];
        const authConfigForEnvironment = authConfig?.[selectedIntegration.environment];

        const baseFields = authConfigForEnvironment?.fields || [];

        const fieldsWithPrefilledValues: ConnectorConfigField[] = baseFields
            .map((field) => {
                const setupValue = accountData?.setupInformation?.[field.key];

                if (accountData && (field.secret || field.type === 'password')) {
                    return {
                        ...field,
                        key: field.key,
                        value: DUMMY_VALUE,
                    };
                }

                if (field.key === 'external-trigger-token') {
                    return {
                        ...field,
                        key: field.key,
                        value: hubData?.external_trigger_token,
                    };
                }

                const evaluationContext = {
                    ...formData,
                    ...accountData?.setupInformation,
                    external_trigger_token: hubData?.external_trigger_token,
                    hub_settings: connectorData.hub_settings,
                };

                if (field.condition) {
                    const evaluated = evaluate(field.condition, evaluationContext);

                    const shouldShow = evaluated != null && evaluated !== 'false';

                    if (!shouldShow) {
                        return;
                    }
                }

                if (!field.value) {
                    return {
                        ...field,
                        key: field.key,
                    };
                }

                const valueToEvaluate = setupValue !== undefined ? setupValue : field.value;
                let evaluatedValue = evaluate(valueToEvaluate?.toString(), evaluationContext);

                if (typeof evaluatedValue === 'object' && evaluatedValue !== null) {
                    evaluatedValue = JSON.stringify(evaluatedValue);
                }

                return {
                    ...field,
                    key: field.key,
                    value: evaluatedValue as string | number | undefined,
                };
            })
            .filter((value) => value != null);

        return {
            fields: fieldsWithPrefilledValues,
            guide: authConfigForEnvironment?.guide,
        };
    }, [connectorData, selectedIntegration, accountData, formData, hubData]);

    const authConfig = useMemo(() => {
        if (!connectorData || !selectedIntegration) {
            return null;
        }
        return connectorData.config.authentication?.[
            selectedIntegration.authentication_config_key
        ]?.[selectedIntegration.environment];
    }, [connectorData, selectedIntegration]);

    const handleConnect = useCallback(async () => {
        if (!selectedIntegration) {
            return;
        }

        setConnectionState({ loading: true, success: false });

        try {
            // Clean up dummy values for secret fields before submission
            const cleanedFormData = { ...formData };
            if (accountData) {
                fields.forEach((field) => {
                    if (
                        (field.secret || field.type === 'password') &&
                        cleanedFormData[field.key] === DUMMY_VALUE
                    ) {
                        delete cleanedFormData[field.key];
                    }
                });
            }

            if (authConfig?.type === 'oauth2') {
                console.log('oauth2');
                window.addEventListener('message', processMessageCallback, false);
                const callbackEmbeddedAccountsUrl = encodeURIComponent(
                    `${dashboardUrl}/embedded/accounts/callback`,
                );
                let windowUrl = `${baseUrl}/connect/oauth2/${selectedIntegration.provider}?redirect_uri=${callbackEmbeddedAccountsUrl}&token=${token}`;

                Object.keys(cleanedFormData).forEach((key) => {
                    windowUrl += `&${key}=${cleanedFormData[key]}`;
                });

                const width = 1024;
                const height = 800;
                const screenX =
                    typeof window.screenX != 'undefined' ? window.screenX : window.screenLeft;
                const screenY =
                    typeof window.screenY != 'undefined' ? window.screenY : window.screenTop;
                const outerWidth =
                    typeof window.outerWidth != 'undefined'
                        ? window.outerWidth
                        : document.body.clientWidth;
                const outerHeight =
                    typeof window.outerHeight != 'undefined'
                        ? window.outerHeight
                        : document.body.clientHeight - 22;
                const left = screenX + (outerWidth - width) / 2;
                const top = screenY + (outerHeight - height) / 2.5;
                const features =
                    'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top;

                connectWindow.current = window.open(windowUrl, 'Connect Account', features);

                if (connectWindow.current) {
                    connectWindow.current.focus();
                }

                console.log(windowUrl);
                return;
            }

            if (accountId) {
                await updateAccount(
                    baseUrl,
                    accountId,
                    token,
                    selectedIntegration.provider,
                    cleanedFormData,
                );
            } else {
                await connectAccount(baseUrl, token, selectedIntegration.provider, cleanedFormData);
            }

            setConnectionState({ loading: false, success: true });
            setTimeout(() => {
                onSuccess?.();
            }, 2000);
        } catch (error) {
            const parsedError = JSON.parse((error as Error).message) as {
                status: number;
                message: string;
            };

            const doubleParsedError = JSON.parse(parsedError.message) as {
                message: string;
                provider_response: string;
            };

            setConnectionState({
                loading: false,
                success: false,
                error: {
                    message: doubleParsedError.message,
                    provider_response: doubleParsedError.provider_response,
                },
            });
        }
    }, [
        baseUrl,
        dashboardUrl,
        token,
        selectedIntegration,
        formData,
        onSuccess,
        accountData,
        fields,
        accountId,
        authConfig,
    ]);

    const isLoading = isLoadingHubData || isLoadingConnectorData || isLoadingAccountData;
    const hasError = !!(errorHubData || errorConnectorData || errorAccountData);

    return {
        // Data
        hubData,
        accountData,
        connectorData,
        selectedIntegration,
        fields,
        guide,

        // State
        formData,
        connectionState,
        isLoading,
        hasError,

        // Errors
        errorHubData,
        errorConnectorData,
        errorAccountData,

        // Actions
        setSelectedIntegration,
        setFormData,
        handleConnect,
    };
};
