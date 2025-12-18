import './main.css';
import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { StackOneHub } from '../src/StackOneHub';
import { request } from '../src/shared/httpClient';
import { HubModes } from '../src/types/types';

const HubWrapper: React.FC = () => {
    const [mode, setMode] = useState<HubModes | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [token, setToken] = useState<string>();
    const apiUrl = import.meta.env.VITE_API_URL ?? 'https://api.stackone.com';
    const appUrl = import.meta.env.VITE_APP_URL ?? 'https://app.stackone.com';
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [accountId, setAccountId] = useState<string>();
    const [originOwnerId, setOriginOwnerId] = useState<string>(
        import.meta.env.VITE_ORIGIN_OWNER_ID ?? 'dummy_customer_id',
    );
    const [originOwnerName, setOriginOwnerName] = useState<string>(
        import.meta.env.VITE_ORIGIN_OWNER_NAME ?? 'dummy_customer_name',
    );
    const [originUsername, setOriginUsername] = useState<string>(
        import.meta.env.VITE_ORIGIN_USERNAME ?? 'dummy_username',
    );

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
                    origin_owner_id: originOwnerId,
                    origin_owner_name: originOwnerName,
                    origin_username: originUsername,
                    account_id: accountId !== '' && accountId != null ? accountId : undefined,
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
    }, [accountId, originOwnerId, originOwnerName, originUsername]);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    return (
        <div className={`hub-container ${theme}`}>
            {loading && <p> Loading token...</p>}
            {error && <p>Error loading token: {error}</p>}
            {token && <p className="token-display">Token: {token}</p>}
            <p>Current mode: {mode || 'No mode selected'}</p>
            <div className="button-row">
                <button onClick={fetchToken}>Get new token</button>
                <button onClick={() => setMode('integration-picker')}>
                    Set Integration Picker mode
                </button>
                <button onClick={() => setMode('csv-importer')}>Set CSV Importer mode</button>
                <button onClick={() => setTheme((theme) => (theme === 'light' ? 'dark' : 'light'))}>
                    {theme === 'light' ? '🌞' : '🌚'}
                </button>
            </div>
            <input
                style={{
                    marginBottom: '10px',
                    width: '100%',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    padding: '5px',
                }}
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
            />
            <input
                style={{
                    marginBottom: '10px',
                    width: '100%',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    padding: '5px',
                }}
                type="text"
                value={originOwnerId}
                onChange={(e) => setOriginOwnerId(e.target.value)}
            />
            <input
                style={{
                    marginBottom: '10px',
                    width: '100%',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    padding: '5px',
                }}
                type="text"
                value={originOwnerName}
                onChange={(e) => setOriginOwnerName(e.target.value)}
            />
            <input
                style={{
                    marginBottom: '10px',
                    width: '100%',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    padding: '5px',
                }}
                type="text"
                value={originUsername}
                onChange={(e) => setOriginUsername(e.target.value)}
            />
            <h1>StackOneHub Demo</h1>
            <StackOneHub
                key={token}
                mode={mode}
                token={token}
                baseUrl={apiUrl}
                theme={theme}
                onSuccess={(account: unknown) => {
                    alert(`success: ${JSON.stringify(account)}`);
                }}
                onClose={() => {
                    setMode(undefined);
                }}
                accountId={accountId}
                appUrl={appUrl}
            />
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
