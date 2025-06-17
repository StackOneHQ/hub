import { getRequest, patchRequest, postRequest } from '../../shared/httpClient';
import { AccountData, ConnectorConfig, HubData } from './types';

export const getHubData = async (token: string, baseUrl: string, provider?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-hub-session-token': token,
    };

    // Add provider header when filtering by specific provider
    if (provider) {
        headers['x-hub-provider'] = provider;
    }

    return await getRequest<HubData>({
        url: `${baseUrl}/hub/connectors`,
        headers,
    });
};

export const getConnectorConfig = async (baseUrl: string, token: string, connectorKey: string) => {
    return await getRequest<ConnectorConfig>({
        url: `${baseUrl}/hub/connectors/${connectorKey}`,
        headers: {
            'Content-Type': 'application/json',
            'x-hub-session-token': token,
        },
    });
};

export const connectAccount = async (
    baseUrl: string,
    token: string,
    provider: string,
    credentials: Record<string, unknown>,
) => {
    return await postRequest<ConnectorConfig>({
        url: `${baseUrl}/hub/accounts`,
        headers: {
            'Content-Type': 'application/json',
            'x-hub-session-token': token,
        },
        body: {
            provider,
            credentials,
        },
    });
};

export const updateAccount = async (
    baseUrl: string,
    accountId: string,
    token: string,
    provider: string,
    credentials: Record<string, unknown>,
) => {
    return await patchRequest<ConnectorConfig>({
        url: `${baseUrl}/hub/accounts/${accountId}`,
        headers: {
            'Content-Type': 'application/json',
            'x-hub-session-token': token,
        },
        body: {
            provider,
            credentials,
        },
    });
};

export const getAccountData = async (baseUrl: string, token: string, accountId: string) => {
    return await getRequest<AccountData>({
        url: `${baseUrl}/hub/accounts/${accountId}`,
        headers: {
            'Content-Type': 'application/json',
            'x-hub-session-token': token,
        },
    });
};
