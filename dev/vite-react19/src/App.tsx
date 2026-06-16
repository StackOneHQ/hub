import { StackOneHub } from '@stackone/hub';
import { version as reactVersion, useEffect, useState } from 'react';

const TOKEN_KEY = 'stackone-hub-token';
const BASE_URL_KEY = 'stackone-hub-base-url';

export default function App() {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '');
    const [baseUrl, setBaseUrl] = useState(
        () => localStorage.getItem(BASE_URL_KEY) ?? 'https://api.stackone.com',
    );
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [events, setEvents] = useState<{ at: string; label: string; detail?: unknown }[]>([]);

    useEffect(() => {
        localStorage.setItem(TOKEN_KEY, token);
    }, [token]);
    useEffect(() => {
        localStorage.setItem(BASE_URL_KEY, baseUrl);
    }, [baseUrl]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: token check is intentionally one-shot on mount.
    useEffect(() => {
        const apiKey = import.meta.env.VITE_STACKONE_API_KEY;
        const apiUrl = import.meta.env.VITE_API_URL ?? 'https://api.stackone.com';
        const host = (() => {
            try {
                return new URL(apiUrl).hostname;
            } catch {
                return '';
            }
        })();
        const isLocalhost = host === 'localhost' || host === '127.0.0.1';
        if (!apiKey || token || !isLocalhost) {
            if (apiKey && !isLocalhost) {
                console.warn(
                    `Skipping connect_sessions auto-fetch — "${apiUrl}" is not localhost. Paste a pre-minted token.`,
                );
            }
            return;
        }
        fetch(`${apiUrl}/connect_sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${btoa(apiKey)}`,
            },
            body: JSON.stringify({
                origin_owner_id: import.meta.env.VITE_ORIGIN_OWNER_ID ?? 'dummy_customer_id',
                origin_owner_name: import.meta.env.VITE_ORIGIN_OWNER_NAME ?? 'dummy_customer_name',
                origin_username: import.meta.env.VITE_ORIGIN_USERNAME ?? 'dummy_customer_username',
            }),
        })
            .then((r) => r.json())
            .then((body) => {
                if (body?.token) {
                    setToken(body.token);
                }
            })
            .catch((err) => console.warn('connect_sessions failed', err));
    }, []);

    const logEvent = (label: string, detail?: unknown) => {
        setEvents((prev) => [{ at: new Date().toLocaleTimeString(), label, detail }, ...prev]);
    };

    return (
        <>
            <header>
                <h1>stackone-hub — React 19 (React export)</h1>
                <p>
                    React {reactVersion} rendering the <code>StackOneHub</code> export directly via
                    Vite.
                </p>
            </header>

            <section className="controls">
                <label>
                    Token
                    <input
                        type="text"
                        name="token"
                        value={token}
                        placeholder="paste connect-session token"
                        onChange={(e) => setToken(e.target.value)}
                    />
                </label>
                <label>
                    Base URL
                    <input
                        type="text"
                        name="baseUrl"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                    />
                </label>
                <div className="row">
                    <button type="button" onClick={() => setTheme('light')}>
                        Light
                    </button>
                    <button type="button" onClick={() => setTheme('dark')}>
                        Dark
                    </button>
                </div>
            </section>

            <StackOneHub
                key={token}
                mode="integration-picker"
                token={token}
                baseUrl={baseUrl}
                theme={theme}
                height="600px"
                onSuccess={(account: unknown) => logEvent('success', account)}
                onClose={() => logEvent('close')}
            />

            <section className="events">
                <h2>Event log</h2>
                <ol>
                    {events.map((event, i) => (
                        <li key={i}>
                            [{event.at}] {event.label}
                            {event.detail ? ` — ${JSON.stringify(event.detail)}` : ''}
                        </li>
                    ))}
                </ol>
            </section>
        </>
    );
}
