import { getRequest, patchRequest, postRequest } from '../../shared/httpClient';
import { AccountData, ConnectorConfig, HubConnectorConfig, HubData } from './types';

export const getHubData = async (token: string, baseUrl: string, provider?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-hub-session-token': token,
    };

    let url = `${baseUrl}/hub/connectors`;

    if (provider) {
        url += `?provider=${encodeURIComponent(provider)}`;
    }

    return await getRequest<HubData>({
        url,
        headers,
    });
};

export const getConnectorConfig = async (baseUrl: string, token: string, integrationId: string) => {
    return await getRequest<HubConnectorConfig>({
        url: `${baseUrl}/hub/connectors/${integrationId}`,
        headers: {
            'Content-Type': 'application/json',
            'x-hub-session-token': token,
        },
    });
};

export const connectAccount = async ({
    baseUrl,
    token,
    credentials,
    integrationId,
}: {
    baseUrl: string;
    token: string;
    credentials: Record<string, unknown>;
    integrationId: string;
}) => {
    return await postRequest<ConnectorConfig>({
        url: `${baseUrl}/hub/accounts`,
        headers: {
            'Content-Type': 'application/json',
            'x-hub-session-token': token,
        },
        body: {
            integration_id: integrationId,
            credentials,
        },
    });
};

export const updateAccount = async ({
    baseUrl,
    accountId,
    token,
    credentials,
    integrationId,
}: {
    baseUrl: string;
    token: string;
    accountId: string;
    credentials: Record<string, unknown>;
    integrationId: string;
}) => {
    return await patchRequest<ConnectorConfig>({
        url: `${baseUrl}/hub/accounts/${accountId}`,
        headers: {
            'Content-Type': 'application/json',
            'x-hub-session-token': token,
        },
        body: {
            integration_id: integrationId,
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
