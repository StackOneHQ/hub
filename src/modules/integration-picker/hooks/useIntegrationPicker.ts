import { evaluate } from '@stackone/expressions';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isFalconVersion } from '../../../shared/utils/utils';
import {
    connectAccount,
    getAccountData,
    getFalconConnectorConfig,
    getHubData,
    getLegacyConnectorConfig,
    updateAccount,
} from '../queries';
import {
    ConnectorConfigField,
    Integration,
    isFalconConnectorConfig,
    isLegacyConnectorConfig,
} from '../types';

const DUMMY_VALUE = 'totally-fake-value';
const OAUTH_STORAGE_KEY = 'oauth_result';
const OAUTH_CHANNEL_NAME = 'oauth_channel';

// Shared retry configuration for queries
const RETRY_CONFIG = {
    retry: (failureCount: number, error: unknown) => {
        // Don't retry on authentication errors (401/403)
        if (error && typeof error === 'object' && 'message' in error) {
            try {
                const parsedError = JSON.parse(error.message as string);
                if (parsedError.status === 401 || parsedError.status === 403) {
                    return false;
                }
            } catch {
                // If parsing fails, allow retry
            }
        }
        return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

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

    const setFormDataCallback = useCallback((data: Record<string, string>) => {
        setFormData(data);
    }, []);
    const connectWindow = useRef<Window | null>(null);
    const checkStateTimeoutRef = useRef<number | null>(null);
    const successTimeoutRef = useRef<number | null>(null);
    const oauthChannelRef = useRef<BroadcastChannel | null>(null);
    const storageListenerRef = useRef<((event: StorageEvent) => void) | null>(null);
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

    const processMessageCallback = useCallback((event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
            return;
        }

        if (!event.data?.type) {
            return;
        }
        if (event.data.type === EventType.AccountConnected) {
            setConnectionState({ loading: false, success: true });
            parent.postMessage(event.data, '*');
        } else if (event.data.type === EventType.CloseOAuth2) {
            if (event.data.error) {
                setConnectionState({
                    loading: false,
                    success: false,
                    error: {
                        message: event.data.error,
                        provider_response: event.data.errorDescription || 'No description',
                    },
                });
            } else {
                setConnectionState({ loading: false, success: false, error: undefined });
            }
        }

        if (connectWindow.current) {
            connectWindow.current.close();
            connectWindow.current = null;
        }

        window.removeEventListener('message', processMessageCallback, false);
    }, []);

    const handleOAuthResultFromAnyChannel = useCallback(
        (data: { type: string; error?: string; errorDescription?: string; account?: unknown }) => {
            if (data.type === EventType.AccountConnected) {
                setConnectionState({ loading: false, success: true });
                parent.postMessage(data, '*');
            } else if (data.type === EventType.CloseOAuth2) {
                if (data.error) {
                    setConnectionState({
                        loading: false,
                        success: false,
                        error: {
                            message: data.error,
                            provider_response: data.errorDescription || 'No description',
                        },
                    });
                } else {
                    setConnectionState({ loading: false, success: false, error: undefined });
                }
            }

            if (connectWindow.current) {
                connectWindow.current.close();
                connectWindow.current = null;
            }
        },
        [],
    );

    useEffect(() => {
        if (typeof BroadcastChannel !== 'undefined') {
            oauthChannelRef.current = new BroadcastChannel(OAUTH_CHANNEL_NAME);
            oauthChannelRef.current.onmessage = (event) => {
                if (event.data?.type) {
                    handleOAuthResultFromAnyChannel(event.data);
                }
            };
        }

        const storageListener = (event: StorageEvent) => {
            if (event.key !== OAUTH_STORAGE_KEY || !event.newValue) {
                return;
            }
            try {
                const data = JSON.parse(event.newValue);
                handleOAuthResultFromAnyChannel(data);
                localStorage.removeItem(OAUTH_STORAGE_KEY);
            } catch (error) {
                console.error('Failed to parse OAuth result from localStorage:', error);
            }
        };

        storageListenerRef.current = storageListener;
        window.addEventListener('storage', storageListener, false);

        return () => {
            if (checkStateTimeoutRef.current !== null) {
                clearTimeout(checkStateTimeoutRef.current);
            }
            if (successTimeoutRef.current !== null) {
                clearTimeout(successTimeoutRef.current);
            }
            if (oauthChannelRef.current) {
                oauthChannelRef.current.close();
                oauthChannelRef.current = null;
            }
            if (storageListenerRef.current) {
                window.removeEventListener('storage', storageListenerRef.current, false);
                storageListenerRef.current = null;
            }
        };
    }, [handleOAuthResultFromAnyChannel]);

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
        ...RETRY_CONFIG,
    });

    const {
        data: hubData,
        isLoading: isLoadingHubData,
        error: errorHubData,
    } = useQuery({
        queryKey: ['hubData', accountData?.provider],
        queryFn: () => {
            if (accountData?.provider) {
                return getHubData(token, baseUrl, accountData.provider);
            }
            return getHubData(token, baseUrl);
        },
        enabled: !accountId || !!accountData,
        ...RETRY_CONFIG,
    });

    useEffect(() => {
        if (accountData && hubData) {
            const matchingIntegration = hubData.integrations.find(
                (integration) => integration.provider === accountData.provider,
            );
            setSelectedIntegration(matchingIntegration ?? null);
        }
    }, [accountData, hubData]);

    const {
        data: connectorData,
        isLoading: isLoadingConnectorData,
        error: errorConnectorData,
    } = useQuery({
        queryKey: [
            'connectorData',
            accountData?.provider,
            accountData?.version,
            selectedIntegration?.provider,
            selectedIntegration?.version,
        ],
        queryFn: async () => {
            if (accountData) {
                if (isFalconVersion(accountData.version)) {
                    return getFalconConnectorConfig(
                        baseUrl,
                        token,
                        `${accountData.provider}@${accountData.version}`,
                    );
                } else {
                    return getLegacyConnectorConfig(baseUrl, token, accountData.provider);
                }
            }
            if (selectedIntegration) {
                if (isFalconVersion(selectedIntegration.version)) {
                    return getFalconConnectorConfig(
                        baseUrl,
                        token,
                        `${selectedIntegration.provider}@${selectedIntegration.version}`,
                    );
                } else {
                    return getLegacyConnectorConfig(baseUrl, token, selectedIntegration.provider);
                }
            }
            return null;
        },
        enabled: Boolean(selectedIntegration) || Boolean(accountData),
        ...RETRY_CONFIG,
    });

    const { fields, guide } = useMemo(() => {
        if (!connectorData || !selectedIntegration) {
            const fields: ConnectorConfigField[] = [];
            return { fields };
        }

        if (isFalconConnectorConfig(connectorData.config)) {
            const fieldsWithPrefilledValues: ConnectorConfigField[] =
                connectorData.config.configFields
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

                        const valueToEvaluate = setupValue !== undefined ? setupValue : field.value;

                        if (!valueToEvaluate) {
                            return {
                                ...field,
                                key: field.key,
                            };
                        }
                        let evaluatedValue = evaluate(
                            valueToEvaluate?.toString(),
                            evaluationContext,
                        );

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
                guide: {
                    supportLink: connectorData.config.support.link,
                    description: connectorData.config.support.description,
                },
            };
        }

        let authenticationConfigKey = selectedIntegration.authentication_config_key;
        let environment = selectedIntegration.environment;

        // TODO: https://stackonehq.atlassian.net/browse/ENG-11396 load this from the account's linked integration config
        if (accountData && accountData.authConfigKey) {
            if (connectorData.config.authentication?.[accountData.authConfigKey]) {
                authenticationConfigKey = accountData.authConfigKey;
                environment = accountData.environment ?? selectedIntegration.environment;
            }
        }

        const authConfig = connectorData.config.authentication?.[authenticationConfigKey];
        const authConfigForEnvironment = authConfig?.[environment];

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

                const valueToEvaluate = setupValue !== undefined ? setupValue : field.value;

                if (!valueToEvaluate) {
                    return {
                        ...field,
                        key: field.key,
                    };
                }
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
        if (isLegacyConnectorConfig(connectorData.config)) {
            let authenticationConfigKey = selectedIntegration.authentication_config_key;
            let environment = selectedIntegration.environment;

            // TODO: https://stackonehq.atlassian.net/browse/ENG-11396 load this from the account's linked integration config
            if (accountData && accountData.authConfigKey) {
                if (connectorData.config.authentication?.[accountData.authConfigKey]) {
                    authenticationConfigKey = accountData.authConfigKey;
                    environment = accountData.environment ?? selectedIntegration.environment;
                }
            }

            return connectorData.config.authentication?.[authenticationConfigKey]?.[environment];
        }
        return connectorData.config;
    }, [connectorData, selectedIntegration, accountData]);

    const [isFormValid, setIsFormValid] = useState(true);

    const handleConnect = useCallback(async () => {
        if (!selectedIntegration) {
            return;
        }

        if (!isFormValid) {
            setConnectionState({
                loading: false,
                success: false,
                error: {
                    message: 'Please fix the validation errors before continuing',
                    provider_response: 'Form validation failed',
                },
            });
            return;
        }

        setConnectionState({ loading: true, success: false });

        try {
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

            // Remove fields with empty string values
            Object.keys(cleanedFormData).forEach((key) => {
                if (cleanedFormData[key] === '') {
                    delete cleanedFormData[key];
                }
            });

            if (authConfig?.type === 'oauth2') {
                window.addEventListener('message', processMessageCallback, false);
                const callbackEmbeddedAccountsUrl = encodeURIComponent(
                    `${dashboardUrl}/embedded/accounts/callback`,
                );
                let windowUrl = `${baseUrl}/connect/oauth2/${selectedIntegration.provider}?redirect_uri=${callbackEmbeddedAccountsUrl}&token=${token}&provider_version=${selectedIntegration.version}`;

                Object.keys(cleanedFormData).forEach((key) => {
                    windowUrl += `&${key}=${encodeURIComponent(cleanedFormData[key])}`;
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
                const left = parseInt((screenX + (outerWidth - width) / 2).toString(), 10);
                const top = parseInt((screenY + (outerHeight - height) / 2.5).toString(), 10);
                const features = `width=${width},height=${height},left=${left},top=${top},noopener=0`;

                connectWindow.current = window.open(windowUrl, 'Connect Account', features);

                if (connectWindow.current) {
                    if (typeof connectWindow.current?.focus === 'function') {
                        connectWindow.current.focus();
                    }

                    const checkWindowState = () => {
                        if (connectWindow.current?.closed) {
                            setConnectionState({ loading: false, success: false });
                            window.removeEventListener('message', processMessageCallback, false);
                            connectWindow.current = null;
                            if (checkStateTimeoutRef.current !== null) {
                                clearTimeout(checkStateTimeoutRef.current);
                                checkStateTimeoutRef.current = null;
                            }
                        } else if (connectWindow.current) {
                            checkStateTimeoutRef.current = window.setTimeout(
                                checkWindowState,
                                1000,
                            );
                        }
                    };
                    checkStateTimeoutRef.current = window.setTimeout(checkWindowState, 1000);
                }

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
                await connectAccount(
                    baseUrl,
                    token,
                    selectedIntegration.provider,
                    selectedIntegration.version,
                    cleanedFormData,
                );
            }

            setConnectionState({ loading: false, success: true });
            if (successTimeoutRef.current !== null) {
                clearTimeout(successTimeoutRef.current);
            }
            successTimeoutRef.current = window.setTimeout(() => {
                onSuccess?.();
                successTimeoutRef.current = null;
            }, 2000);
        } catch (error) {
            let errorMessage = 'An unexpected error occurred';
            let providerResponse = 'Please try again later';

            try {
                // Try to parse the error message
                const parsedError = JSON.parse((error as Error).message) as {
                    status: number;
                    message: string;
                    provider_response?: string;
                };

                // Try to parse the nested message
                try {
                    const doubleParsedError = JSON.parse(parsedError.message) as {
                        message: string;
                        provider_response: string;
                    };
                    errorMessage = doubleParsedError.message || errorMessage;
                    providerResponse = doubleParsedError.provider_response || providerResponse;
                } catch {
                    // If double parsing fails, use the first level message
                    errorMessage = parsedError.message || errorMessage;
                    providerResponse = parsedError.provider_response || providerResponse;
                }
            } catch {
                // If all parsing fails, use the original error message
                errorMessage = (error as Error).message || errorMessage;
            }

            setConnectionState({
                loading: false,
                success: false,
                error: {
                    message: errorMessage,
                    provider_response: providerResponse,
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
        processMessageCallback,
        isFormValid,
    ]);

    const isLoading = isLoadingHubData || isLoadingConnectorData || isLoadingAccountData;
    const hasError = !!(errorHubData || errorConnectorData || errorAccountData);

    // Reset connection state when there are query errors to prevent stuck loading states
    useEffect(() => {
        if (hasError && connectionState.loading) {
            setConnectionState((prev) => ({
                ...prev,
                loading: false,
            }));
        }
    }, [hasError, connectionState.loading]);

    const resetConnectionState = useCallback(() => {
        setConnectionState({ loading: false, success: false });
    }, []);

    const resetAllErrors = useCallback(() => {
        setConnectionState({ loading: false, success: false });
        // Note: React Query errors will be reset automatically when queries are refetched
    }, []);

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
        isFormValid,

        // Errors
        errorHubData,
        errorConnectorData,
        errorAccountData,

        // Actions
        setSelectedIntegration,
        setFormData: setFormDataCallback,
        setIsFormValid,
        handleConnect,
        resetConnectionState,
        resetAllErrors,
    };
};
