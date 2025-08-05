import {
    Card,
    Flex,
    FlexAlign,
    FlexJustify,
    FooterLinks,
    MalachiteContext,
    PartialMalachiteTheme,
    Typography,
    applyDarkTheme,
    applyLightTheme,
    applyTheme,
} from '@stackone/malachite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CsvImporter } from './modules/csv-importer.tsx/CsvImporter';
import { IntegrationPicker } from './modules/integration-picker/IntegrationPicker';
import ErrorContainer from './shared/components/error';
import ErrorBoundary from './shared/components/errorBoundary';
import { HubModes } from './types/types';

interface StackOneHubProps {
    mode?: HubModes;
    token?: string;
    baseUrl?: string;
    appUrl?: string;
    height?: string;
    theme?: 'light' | 'dark' | PartialMalachiteTheme;
    accountId?: string;
    onSuccess?: () => void;
    onClose?: () => void;
    onCancel?: () => void;
}

export const StackOneHub: React.FC<StackOneHubProps> = ({
    mode,
    token,
    baseUrl,
    appUrl,
    height = '500px',
    theme = 'light',
    accountId,
    onSuccess,
    onClose,
    onCancel,
}) => {
    const defaultBaseUrl = 'https://api.stackone.com';
    const apiUrl = baseUrl ?? defaultBaseUrl;
    const defaultDashboardUrl = 'https://app.stackone.com';
    const dashboardUrl = appUrl ?? defaultDashboardUrl;
    useEffect(() => {
        if (theme === 'dark') {
            applyDarkTheme();
        } else if (theme === 'light') {
            applyLightTheme();
        } else {
            applyTheme(theme);
        }
    }, [theme]);

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: 1,
                retryDelay: 500,
                refetchOnMount: false,
                retryOnMount: false,
            },
        },
    });

    if (!token) {
        return (
            <MalachiteContext>
                <ErrorBoundary
                    fallback={
                        <Card height={height}>
                            <ErrorContainer />
                        </Card>
                    }
                >
                    <Card height={height} footer={<FooterLinks />}>
                        <Flex justify={FlexJustify.Center} align={FlexAlign.Center} fullHeight>
                            <Typography.PageTitle>No token provided</Typography.PageTitle>
                        </Flex>
                    </Card>
                </ErrorBoundary>
            </MalachiteContext>
        );
    }
    if (!mode) {
        return (
            <MalachiteContext>
                <ErrorBoundary
                    fallback={
                        <Card height={height}>
                            <ErrorContainer />
                        </Card>
                    }
                >
                    <Card height={height} footer={<FooterLinks />}>
                        <Flex justify={FlexJustify.Center} align={FlexAlign.Center} fullHeight>
                            <Typography.PageTitle>No mode selected</Typography.PageTitle>
                        </Flex>
                    </Card>
                </ErrorBoundary>
            </MalachiteContext>
        );
    }

    return (
        <MalachiteContext>
            <ErrorBoundary
                fallback={
                    <Card height={height}>
                        <ErrorContainer />
                    </Card>
                }
            >
                <QueryClientProvider client={queryClient}>
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
                </QueryClientProvider>
            </ErrorBoundary>
        </MalachiteContext>
    );
};
