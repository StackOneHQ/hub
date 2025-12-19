import { getRequest } from './httpClient';
import { FeatureFlag } from './types/featureFlags';

export const getSettings = async (baseUrl: string, token: string) => {
    return await getRequest<{
        enabled_features: FeatureFlag[];
        existing_accounts?: Array<{
            id: string;
            integration_id: string;
        }>;
    }>({
        url: `${baseUrl}/hub/settings`,
        headers: {
            'Content-Type': 'application/json',
            'x-hub-session-token': token,
        },
    });
};
