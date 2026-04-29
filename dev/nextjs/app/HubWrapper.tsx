'use client';

import { StackOneHub } from '@stackone/hub';
import { useState } from 'react';

interface HubWrapperProps {
    initialToken: string;
    apiUrl: string;
    appUrl: string;
}

export default function HubWrapper({ initialToken, apiUrl, appUrl }: HubWrapperProps) {
    const [token, setToken] = useState(initialToken);
    const [manualToken, setManualToken] = useState('');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    return (
        <div className={theme}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                    style={{ flex: 1, padding: 6, border: '1px solid #ccc', borderRadius: 4 }}
                    type="text"
                    placeholder="Paste a connect session token"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                />
                <button onClick={() => setToken(manualToken)} disabled={!manualToken}>
                    Use token
                </button>
                <button
                    aria-label={
                        theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
                    }
                    onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                >
                    {theme === 'light' ? '🌞' : '🌚'}
                </button>
            </div>
            {token ? (
                <p style={{ fontSize: 12, color: '#666', wordBreak: 'break-all' }}>
                    Token: {token}
                </p>
            ) : (
                <p style={{ fontSize: 12, color: '#666' }}>
                    No token yet — set <code>STACKONE_API_KEY</code> in <code>.env</code> for
                    server-side fetching, or paste one above.
                </p>
            )}
            <StackOneHub
                key={token}
                mode="integration-picker"
                token={token || undefined}
                baseUrl={apiUrl}
                appUrl={appUrl}
                theme={theme}
                onSuccess={(account) => {
                    alert(`success: ${JSON.stringify(account)}`);
                }}
            />
        </div>
    );
}
