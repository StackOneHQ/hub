import { useQuery } from '@tanstack/react-query';
import { IntegrationPicker } from './modules/integration-picker/IntegrationPicker';
import { FeatureFlagProvider } from './shared/contexts/featureFlagContext';
import { getSettings } from './shared/queries';
import { HubModes } from './types/types';

interface HubProps {
    mode: HubModes;
    token: string;
    apiUrl: string;
    dashboardUrl: string;
    height: string;
    onSuccess?: () => void;
    onClose?: () => void;
    onCancel?: () => void;
    accountId?: string;
}
export const Hub = ({
    mode,
    token,
    apiUrl,
    dashboardUrl,
    height,
    onSuccess,
    onClose,
    onCancel,
    accountId,
}: HubProps) => {
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: () => getSettings(apiUrl, token),
    });

    return (
        <FeatureFlagProvider featureFlags={settings?.enabled_features ?? []}>
            {mode === 'integration-picker' && (
                <IntegrationPicker
                    token={token}
                    baseUrl={apiUrl}
                    dashboardUrl={dashboardUrl}
                    height={height}
                    onSuccess={onSuccess}
                    onClose={onClose}
                    onCancel={onCancel}
                    accountId={accountId}
                />
            )}
        </FeatureFlagProvider>
    );
};
