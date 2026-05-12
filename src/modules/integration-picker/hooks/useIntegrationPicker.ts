import { evaluate } from '@stackone/expressions';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    cancelConnectionAttempt,
    connectAccount,
    createConnectionAttempt,
    getAccountData,
    getConnectorConfig,
    getHubData,
    pollConnectionAttempt,
    updateAccount,
} from '../queries';
import {
    ConnectorConfigField,
    Integration,
    isFalconConnectorConfig,
    isLegacyConnectorConfig,
} from '../types';
import { isSecretPlaceholder } from '../utils/secretPlaceholder';

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
    onSuccess?: (account: { id: string; provider: string }) => void;
    dashboardUrl?: string;
    debug?: boolean;
}

export enum EventType {
    AccountConnected = 'AccountConnected',
}

const POLL_TIMEOUT_MS = 5 * 60 * 1000;

export const useIntegrationPicker = ({
    token,
    baseUrl,
    accountId,
    onSuccess,
    dashboardUrl,
    debug,
}: UseIntegrationPickerProps) => {
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [editingSecrets, setEditingSecrets] = useState<Set<string>>(new Set());

    const setFormDataCallback = useCallback((data: Record<string, string>) => {
        setFormData(data);
    }, []);
    const connectWindow = useRef<Window | null>(null);
    const connectionAttemptIdRef = useRef<string | null>(null);
    const pollingIntervalRef = useRef<number | null>(null);
    const popupWatcherRef = useRef<number | null>(null);
    const coopDetectedRef = useRef(false);
    const [connectionState, setConnectionState] = useState<{
        loading: boolean;
        success: boolean;
        timedOut?: boolean;
        error?: {
            message: string;
            provider_response: string;
        };
    }>({
        loading: false,
        success: false,
    });
    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current !== null) {
            clearTimeout(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        connectionAttemptIdRef.current = null;
    }, []);

    const handleSuccess = useCallback(
        (account: { id: string; provider: string }) => {
            setConnectionState({ loading: false, success: true });
            onSuccess?.(account);
        },
        [onSuccess],
    );

    const debugRef = useRef(debug);
    debugRef.current = debug;

    const stopPopupWatcher = useCallback(() => {
        if (popupWatcherRef.current !== null) {
            clearTimeout(popupWatcherRef.current);
            popupWatcherRef.current = null;
        }
    }, []);

    const closeOAuthPopup = useCallback(() => {
        stopPolling();
        stopPopupWatcher();
        if (connectWindow.current) {
            connectWindow.current.close();
            connectWindow.current = null;
        }
    }, [stopPolling, stopPopupWatcher]);

    useEffect(() => {
        return () => {
            stopPolling();
            stopPopupWatcher();
        };
    }, [stopPolling, stopPopupWatcher]);

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

    useEffect(() => {
        if (hubData && !selectedIntegration) {
            const activeIntegrations = hubData.integrations.filter(
                (integration) => integration.active,
            );
            if (activeIntegrations.length === 1) {
                setSelectedIntegration(activeIntegrations[0]);
            }
        }
    }, [hubData, selectedIntegration]);

    const {
        data: connectorData,
        isLoading: isLoadingConnectorData,
        error: errorConnectorData,
    } = useQuery({
        queryKey: [
            'connectorData',
            accountData?.integrationId,
            selectedIntegration?.integration_id,
        ],
        queryFn: async () => {
            if (accountData) {
                return getConnectorConfig(baseUrl, token, accountData.integrationId);
            }
            if (selectedIntegration) {
                return getConnectorConfig(baseUrl, token, selectedIntegration.integration_id);
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

                        if (field.key === 'external-trigger-token') {
                            return {
                                ...field,
                                key: field.key,
                                value: hubData?.external_trigger_token,
                            };
                        }

                        if (accountData && (field.secret !== false || field.type === 'password')) {
                            const secretValue = accountData.secrets?.[field.key];
                            if (secretValue) {
                                return {
                                    ...field,
                                    key: field.key,
                                    value: secretValue,
                                };
                            }
                            return {
                                ...field,
                                key: field.key,
                                value: '',
                            };
                        }

                        const evaluationContext = {
                            ...formData,
                            ...accountData?.setupInformation,
                            external_trigger_token: hubData?.external_trigger_token,
                            webhooks_url: hubData?.webhooks_url,
                            events_encoded_context: hubData?.events_encoded_context,
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
                    supportLink: connectorData.config.support?.link,
                    description: connectorData.config.support?.description ?? '',
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

                    return {
                        ...field,
                        key: field.key,
                        display: shouldShow,
                    };
                }

                if (accountData && (field.secret !== false || field.type === 'password')) {
                    const secretValue = accountData.secrets?.[field.key];
                    if (secretValue) {
                        return {
                            ...field,
                            key: field.key,
                            value: secretValue,
                        };
                    }
                    return {
                        ...field,
                        key: field.key,
                        value: '',
                    };
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

    const startPolling = useCallback(
        (attemptId: string, provider: string) => {
            const startedAt = Date.now();

            const poll = async () => {
                if (!pollingIntervalRef.current) return;

                if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
                    if (debugRef.current) {
                        console.debug('[hub] poll timed out', { attemptId });
                    }
                    closeOAuthPopup();
                    cancelConnectionAttempt(baseUrl, token, attemptId).catch((error) => {
                        if (debugRef.current) {
                            console.debug('[hub] cancelConnectionAttempt failed', {
                                attemptId,
                                error,
                            });
                        }
                    });
                    setConnectionState({ loading: false, success: false, timedOut: true });
                    return;
                }

                const result = await pollConnectionAttempt(baseUrl, token, attemptId).catch(
                    () => null,
                );

                if (!pollingIntervalRef.current) return;

                if (!result) {
                    if (debugRef.current) {
                        console.debug('[hub] poll failed (network error), retrying');
                    }
                    pollingIntervalRef.current = window.setTimeout(poll, 2000);
                    return;
                }

                if (debugRef.current && result.status !== 'pending') {
                    console.debug('[hub] poll result', { attemptId, ...result });
                }

                if (result.status === 'authenticated' && result.account) {
                    closeOAuthPopup();
                    handleSuccess({ id: result.account.id, provider });
                    parent.postMessage(
                        {
                            type: EventType.AccountConnected,
                            account: { id: result.account.id, provider },
                        },
                        '*',
                    );
                } else if (result.status === 'error') {
                    closeOAuthPopup();
                    setConnectionState({
                        loading: false,
                        success: false,
                        error: {
                            message: result.error?.code ?? 'OAuth error',
                            provider_response: result.error?.description ?? 'No description',
                        },
                    });
                } else if (result.status === 'cancelled' || result.status === 'expired') {
                    closeOAuthPopup();
                    setConnectionState({ loading: false, success: false });
                } else {
                    pollingIntervalRef.current = window.setTimeout(poll, 2000);
                }
            };

            pollingIntervalRef.current = window.setTimeout(poll, 2000);
        },
        [baseUrl, token, closeOAuthPopup, handleSuccess],
    );

    const startPopupWatcher = useCallback(
        (provider: string) => {
            let firstTick = true;
            const check = async () => {
                if (firstTick) {
                    firstTick = false;
                    if (!connectWindow.current || connectWindow.current.closed) {
                        if (debugRef.current) {
                            console.debug(
                                '[hub] popup reads as closed on first tick, assuming COOP isolation — popup-close detection disabled',
                            );
                        }
                        coopDetectedRef.current = true;
                        popupWatcherRef.current = null;
                        return;
                    }
                }

                if (connectWindow.current && !connectWindow.current.closed) {
                    popupWatcherRef.current = window.setTimeout(check, 1000);
                    return;
                }

                popupWatcherRef.current = null;

                if (!pollingIntervalRef.current) return;
                if (coopDetectedRef.current) return;

                const attemptId = connectionAttemptIdRef.current;
                if (!attemptId) {
                    closeOAuthPopup();
                    setConnectionState({ loading: false, success: false });
                    return;
                }

                const final = await pollConnectionAttempt(baseUrl, token, attemptId).catch(
                    (error) => {
                        if (debugRef.current) {
                            console.debug('[hub] final poll failed after popup closed', {
                                attemptId,
                                error,
                            });
                        }
                        return null;
                    },
                );

                if (!pollingIntervalRef.current) return;

                if (final?.status === 'authenticated' && final.account) {
                    if (debugRef.current) {
                        console.debug('[hub] popup closed but auth completed', { attemptId });
                    }
                    closeOAuthPopup();
                    handleSuccess({ id: final.account.id, provider });
                    parent.postMessage(
                        {
                            type: EventType.AccountConnected,
                            account: { id: final.account.id, provider },
                        },
                        '*',
                    );
                    return;
                }

                if (debugRef.current) {
                    console.debug('[hub] popup closed by user, cancelling attempt', { attemptId });
                }
                closeOAuthPopup();
                cancelConnectionAttempt(baseUrl, token, attemptId).catch((error) => {
                    if (debugRef.current) {
                        console.debug('[hub] cancelConnectionAttempt failed', {
                            attemptId,
                            error,
                        });
                    }
                });
                setConnectionState({ loading: false, success: false });
            };
            popupWatcherRef.current = window.setTimeout(check, 1000);
        },
        [baseUrl, token, closeOAuthPopup, handleSuccess],
    );

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
                    if (field.secret !== false || field.type === 'password') {
                        const fieldValue = cleanedFormData[field.key];
                        if (isSecretPlaceholder(fieldValue) && !editingSecrets.has(field.key)) {
                            delete cleanedFormData[field.key];
                        }
                    }
                });
            }

            Object.keys(cleanedFormData).forEach((key) => {
                if (cleanedFormData[key] === '') {
                    delete cleanedFormData[key];
                }
            });

            const shouldRedirectForOAuth =
                authConfig?.type === 'oauth2' &&
                ('grantType' in authConfig && authConfig.grantType !== 'authorization_code'
                    ? false
                    : true);

            if (debugRef.current) {
                console.debug('[hub] handleConnect', {
                    integration: selectedIntegration.integration_id,
                    path: shouldRedirectForOAuth ? 'oauth-redirect' : 'credential-form',
                    updating: !!accountId,
                });
            }

            if (shouldRedirectForOAuth) {
                const attemptResult = await createConnectionAttempt(baseUrl, token).catch(
                    () => null,
                );
                const attemptId = attemptResult?.id ?? null;
                connectionAttemptIdRef.current = attemptId;

                if (!attemptId) {
                    if (debugRef.current) {
                        console.debug('[hub] connection attempt creation failed');
                    }
                    setConnectionState({
                        loading: false,
                        success: false,
                        error: {
                            message: 'Failed to start OAuth flow',
                            provider_response:
                                'Could not create a connection attempt. Please try again.',
                        },
                    });
                    return;
                }

                if (debugRef.current) {
                    console.debug('[hub] connection attempt created', { attemptId });
                }

                const callbackEmbeddedAccountsUrl = encodeURIComponent(
                    `${dashboardUrl}/embedded/accounts/callback`,
                );
                let windowUrl = `${baseUrl}/connect/oauth2/${selectedIntegration.integration_id}?redirect_uri=${callbackEmbeddedAccountsUrl}&token=${token}&connection_attempt_id=${attemptId}`;
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

                if (!connectWindow.current) {
                    if (debugRef.current) {
                        console.debug('[hub] popup was blocked by browser');
                    }
                    closeOAuthPopup();
                    cancelConnectionAttempt(baseUrl, token, attemptId).catch((error) => {
                        if (debugRef.current) {
                            console.debug('[hub] cancelConnectionAttempt failed', {
                                attemptId,
                                error,
                            });
                        }
                    });
                    setConnectionState({
                        loading: false,
                        success: false,
                        error: {
                            message: 'Popup blocked',
                            provider_response:
                                'Your browser blocked the login popup. Please allow popups for this site and try again.',
                        },
                    });
                    return;
                }

                coopDetectedRef.current = false;

                if (typeof connectWindow.current.focus === 'function') {
                    connectWindow.current.focus();
                }
                startPolling(attemptId, selectedIntegration.provider);
                startPopupWatcher(selectedIntegration.provider);
                return;
            }

            let successData: { id: string; provider: string } | undefined;

            if (accountId) {
                await updateAccount({
                    baseUrl,
                    accountId,
                    token,
                    integrationId: selectedIntegration.integration_id,
                    credentials: cleanedFormData,
                });
                successData = { id: accountId, provider: selectedIntegration.provider };
            } else {
                const response = await connectAccount({
                    baseUrl,
                    token,
                    credentials: cleanedFormData,
                    integrationId: selectedIntegration.integration_id,
                });
                if (!response) {
                    throw new Error('Failed to create account');
                }
                successData = { id: response.id, provider: selectedIntegration.provider };
            }

            handleSuccess(successData);
        } catch (error) {
            let errorMessage = 'An unexpected error occurred';
            let providerResponse = 'Please try again later';

            try {
                const parsedError = JSON.parse((error as Error).message) as {
                    status: number;
                    message: string;
                    provider_response?: string;
                };

                try {
                    const doubleParsedError = JSON.parse(parsedError.message) as {
                        message: string;
                        provider_response: string;
                    };
                    errorMessage = doubleParsedError.message || errorMessage;
                    providerResponse = doubleParsedError.provider_response || providerResponse;
                } catch {
                    errorMessage = parsedError.message || errorMessage;
                    providerResponse = parsedError.provider_response || providerResponse;
                }
            } catch {
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
        editingSecrets,
        handleSuccess,
        accountData,
        fields,
        accountId,
        authConfig,
        closeOAuthPopup,
        startPolling,
        startPopupWatcher,
        isFormValid,
    ]);

    const handleCancelOAuth = useCallback(() => {
        const attemptId = connectionAttemptIdRef.current;
        if (debugRef.current) {
            console.debug('[hub] OAuth cancelled by user', { attemptId });
        }
        closeOAuthPopup();
        setConnectionState({ loading: false, success: false });
        if (attemptId) {
            cancelConnectionAttempt(baseUrl, token, attemptId).catch((error) => {
                if (debugRef.current) {
                    console.debug('[hub] cancelConnectionAttempt failed', { attemptId, error });
                }
            });
        }
    }, [baseUrl, token, closeOAuthPopup]);

    const isLoading = isLoadingHubData || isLoadingConnectorData || isLoadingAccountData;
    const hasError = !!(errorHubData || errorConnectorData || errorAccountData);

    // biome-ignore lint/correctness/useExhaustiveDependencies: selectedIntegration is intentionally used to reset editing state when integration changes
    useEffect(() => {
        setEditingSecrets(new Set());
    }, [selectedIntegration]);

    // Reset connection state when there are query errors to prevent stuck loading states
    useEffect(() => {
        if (hasError && connectionState.loading) {
            setConnectionState((prev) => ({
                ...prev,
                loading: false,
            }));
        }
    }, [hasError, connectionState.loading]);

    const prevLoadingRef = useRef(connectionState.loading);
    useEffect(() => {
        if (debug && prevLoadingRef.current && !connectionState.loading) {
            console.debug('[hub] connectionState.loading → false', connectionState);
        }
        prevLoadingRef.current = connectionState.loading;
    }, [debug, connectionState]);

    const resetConnectionState = useCallback(() => {
        setConnectionState({ loading: false, success: false });
        setEditingSecrets(new Set());
    }, []);

    const resetAllErrors = useCallback(() => {
        setConnectionState({ loading: false, success: false });
        setEditingSecrets(new Set());
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
        handleCancelOAuth,
        resetConnectionState,
        resetAllErrors,
        editingSecrets,
        setEditingSecrets,
    };
};
