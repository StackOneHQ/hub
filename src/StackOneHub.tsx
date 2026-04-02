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
import { useEffect, useRef, useState } from 'react';
import { Hub } from './Hub';
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
    onSuccess?: (account: { id: string; provider: string }) => void;
    onClose?: () => void;
    onCloseLabel?: string;
    showFooterLinks?: boolean;
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
    onCloseLabel,
    showFooterLinks,
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

    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        retry: 1,
                        retryDelay: 500,
                        refetchOnMount: false,
                        retryOnMount: false,
                    },
                },
            }),
    );
    const prevTokenRef = useRef(token);
    useEffect(() => {
        if (prevTokenRef.current !== token) {
            prevTokenRef.current = token;
            queryClient.clear();
        }
    }, [token, queryClient]);

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
                    <Hub
                        mode={mode ?? 'integration-picker'}
                        token={token}
                        apiUrl={apiUrl}
                        dashboardUrl={dashboardUrl}
                        height={height}
                        onSuccess={onSuccess}
                        accountId={accountId}
                        onClose={onClose}
                        onCloseLabel={onCloseLabel}
                        showFooterLinks={showFooterLinks}
                    />
                </QueryClientProvider>
            </ErrorBoundary>
        </MalachiteContext>
    );
};
