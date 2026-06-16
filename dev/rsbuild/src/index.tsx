import { StackOneHub } from '@stackone/hub';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const TOKEN_KEY = 'stackone-hub-token';
const BASE_URL_KEY = 'stackone-hub-base-url';

function App() {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '');
    const [baseUrl, setBaseUrl] = useState(
        () => localStorage.getItem(BASE_URL_KEY) ?? 'https://api.stackone.com',
    );
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [active, setActive] = useState(false);

    useEffect(() => {
        localStorage.setItem(TOKEN_KEY, token);
    }, [token]);
    useEffect(() => {
        localStorage.setItem(BASE_URL_KEY, baseUrl);
    }, [baseUrl]);

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 720 }}>
            <h1>stackone-hub — rsbuild (React export)</h1>
            <p>
                Bundles the React <code>{'<StackOneHub>'}</code> export with rsbuild (Rspack) for a
                browser target.
            </p>
            <label style={{ display: 'block', marginBottom: 8 }}>
                Token
                <input
                    style={{ display: 'block', width: '100%' }}
                    name="token"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="paste a connect-session token"
                />
            </label>
            <label style={{ display: 'block', marginBottom: 8 }}>
                Base URL
                <input
                    style={{ display: 'block', width: '100%' }}
                    name="baseUrl"
                    value={baseUrl}
                    onChange={(event) => setBaseUrl(event.target.value)}
                />
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button type="button" onClick={() => setActive((value) => !value)}>
                    {active ? 'Unmount hub' : 'Mount hub'}
                </button>
                <button
                    type="button"
                    onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
                >
                    Theme: {theme}
                </button>
            </div>
            {active ? (
                <StackOneHub
                    key={token}
                    mode="integration-picker"
                    token={token}
                    baseUrl={baseUrl}
                    theme={theme}
                    onSuccess={(account: unknown) => {
                        console.log('success', account);
                    }}
                    onClose={() => setActive(false)}
                />
            ) : null}
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}
