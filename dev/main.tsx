import { Button, ModeToggle } from '@stackone/malachite';
import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { StackOneHub } from '../src/StackOneHub';
import { HubModes } from '../src/types/types';
import { request } from '../src/shared/httpClient';
import { ThemeProvider } from '@stackone/malachite';

const HubWrapper: React.FC = () => {
    const [mode, setMode] = useState<HubModes>('integration-picker');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [token, setToken] = useState<string>();
    const apiUrl = import.meta.env.VITE_API_URL ?? 'https://api.stackone.com';

    const fetchToken = useCallback(async () => {
        try {
            setLoading(true);
            const apiKey = import.meta.env.VITE_STACKONE_API_KEY;
            const encodedApiKey = btoa(apiKey ?? '');

            const response = await request<{ token: string }>({
                url: `${apiUrl}/connect_sessions`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${encodedApiKey}`,
                },
                body: {
                    metadata: { source: 'hub' },
                    origin_owner_id: import.meta.env.VITE_ORIGIN_OWNER_ID ?? 'dummy_customer_id',
                    origin_owner_name:
                        import.meta.env.VITE_ORIGIN_OWNER_NAME ?? 'dummy_customer_name',
                    origin_username: import.meta.env.VITE_ORIGIN_USERNAME ?? 'dummy_username',
                },
            });
            if (!response) {
                throw new Error('Failed to fetch token');
            }

            setToken(response.token);
        } catch (error) {
            console.error('Error fetching token:', error);
            setError(error.message as string);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    return (
        <div>
            <p>Current mode: {mode || 'No mode selected'}</p>
            {loading && <p> Loading token...</p>}
            {error && <p>Error loading token: {error}</p>}
            {token && <p>Token: {token}</p>}
            <button onClick={fetchToken}>Fetch Token</button>
            <button onClick={() => setMode('integration-picker')}>
                Set Integration Picker mode
            </button>
            <button onClick={() => setMode('csv-importer')}>Set CSV Importer mode</button>
            <h1>StackOneHub Demo</h1>
            <ThemeProvider>
                <div>
                    <div>
                        <ModeToggle />
                        <div style={{ height: '25px' }} />
                        <StackOneHub mode={mode} token={token} baseUrl={apiUrl} />
                    </div>
                </div>
            </ThemeProvider>
        </div>
    );
};

const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <HubWrapper />
        </React.StrictMode>,
    );
}
