import { Button, ModeToggle, ThemeProvider } from '@stackone/malachite';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { StackOneHub } from '../src/StackOneHub';
import { HubModes } from '../src/types/types';

const HubWrapper: React.FC = () => {
    const [mode, setMode] = useState<HubModes>();
    const [token, setToken] = useState<string>();
    const apiUrl = import.meta.env.VITE_API_URL ?? 'https://api.stackone.com';

    const fetchToken = async () => {
        try {
            console.log('API URL:', apiUrl);
            console.log({ environment: import.meta.env });

            const apiKey = import.meta.env.VITE_STACKONE_API_KEY;
            const encodedApiKey = btoa(apiKey ?? '');

            const response = await fetch(`${apiUrl}/connect_sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${encodedApiKey}`,
                },
                body: JSON.stringify({
                    metadata: { source: 'hub' },
                    origin_owner_id: import.meta.env.VITE_ORIGIN_OWNER_ID ?? 'dummy_customer_id',
                    origin_owner_name:
                        import.meta.env.VITE_ORIGIN_OWNER_NAME ?? 'dummy_customer_name',
                    origin_username: import.meta.env.VITE_ORIGIN_USERNAME ?? 'dummy_username',
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setToken(data.token);
        } catch (error) {
            console.error('Error fetching token:', error);
        }
    };

    return (
        <ThemeProvider>
            <div>
                <div>
                    <h1>StackOneHub Demo</h1>
                    <p>Current mode: {mode}</p>
                    <button>test</button>
                    <ModeToggle />
                    <Button type="primary" onClick={fetchToken}>
                        Fetch Token
                    </Button>
                    <Button type="secondary" onClick={() => setMode('integration-picker')}>
                        Set Integration Picker mode
                    </Button>
                    <Button type="warning" onClick={() => setMode('csv-importer')}>
                        Set CSV Importer mode
                    </Button>

                    <StackOneHub mode={mode} token={token} baseUrl={apiUrl} />
                </div>
            </div>
        </ThemeProvider>
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
