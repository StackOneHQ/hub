import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    connectAccount,
    getAccountData,
    getConnectorConfig,
    getHubData,
    updateAccount,
} from '../queries';
import { Integration } from '../types';

const DUMMY_VALUE = 'totally-fake-value';

interface UseIntegrationPickerProps {
    token: string;
    baseUrl: string;
    accountId?: string;
    onSuccess?: () => void;
}

export const useIntegrationPicker = ({
    token,
    baseUrl,
    accountId,
    onSuccess,
}: UseIntegrationPickerProps) => {
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
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
            return { fields: [] };
        }

        const authConfig =
            connectorData.authentication?.[selectedIntegration.authentication_config_key];
        const authConfigForEnvironment = authConfig?.[selectedIntegration.environment];

        const baseFields = authConfigForEnvironment?.fields || [];

        const fieldsWithPrefilledValues = baseFields.map((field) => {
            const setupValue = accountData?.setupInformation?.[field.key];

            if (accountData && (field.secret || field.type === 'password')) {
                return {
                    ...field,
                    value: DUMMY_VALUE,
                };
            }

            if (field.key === 'external-trigger-token') {
                return {
                    ...field,
                    value: hubData?.external_trigger_token,
                };
            }

            return {
                ...field,
                value: setupValue !== undefined ? setupValue : field.value,
            };
        });

        return {
            fields: fieldsWithPrefilledValues,
            guide: authConfigForEnvironment?.guide,
        };
    }, [connectorData, selectedIntegration, accountData]);

    const handleConnect = useCallback(async () => {
        if (!selectedIntegration) return;

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
    }, [baseUrl, token, selectedIntegration, formData, onSuccess, accountData, fields, accountId]);

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
