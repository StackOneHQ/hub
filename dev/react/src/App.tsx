import { useEffect, useRef, useState } from 'react';

const TOKEN_KEY = 'stackone-hub-token';
const BASE_URL_KEY = 'stackone-hub-base-url';

declare global {
    // biome-ignore lint/style/noNamespace: JSX intrinsic-element augmentation requires namespace syntax.
    namespace JSX {
        interface IntrinsicElements {
            'stackone-hub': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    token?: string;
                    'base-url'?: string;
                    'app-url'?: string;
                    mode?: string;
                    height?: string;
                    theme?: string;
                    'account-id'?: string;
                    'on-close-label'?: string;
                    'show-footer-links'?: boolean;
                    debug?: boolean;
                },
                HTMLElement
            >;
        }
    }
}

export default function App() {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '');
    const [baseUrl, setBaseUrl] = useState(
        () => localStorage.getItem(BASE_URL_KEY) ?? 'https://api.stackone.com',
    );
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [events, setEvents] = useState<{ at: string; label: string; detail?: unknown }[]>([]);
    const hubRef = useRef<HTMLElement>(null);

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
        if (!apiKey || token) {
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

    useEffect(() => {
        const el = hubRef.current;
        if (!el) {
            return;
        }
        const onSuccess = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            setEvents((prev) => [
                { at: new Date().toLocaleTimeString(), label: 'success', detail },
                ...prev,
            ]);
        };
        const onClose = () => {
            setEvents((prev) => [{ at: new Date().toLocaleTimeString(), label: 'close' }, ...prev]);
        };
        el.addEventListener('success', onSuccess);
        el.addEventListener('close', onClose);
        return () => {
            el.removeEventListener('success', onSuccess);
            el.removeEventListener('close', onClose);
        };
    }, []);

    return (
        <>
            <header>
                <h1>stackone-hub — React (web-component path)</h1>
                <p>
                    React 19 mounting <code>&lt;stackone-hub&gt;</code> directly, with{' '}
                    <code>addEventListener</code> via ref. Not the <code>StackOneHub</code> export.
                </p>
            </header>

            <section className="controls">
                <label>
                    Token
                    <input
                        type="text"
                        value={token}
                        placeholder="paste connect-session token"
                        onChange={(e) => setToken(e.target.value)}
                    />
                </label>
                <label>
                    Base URL
                    <input
                        type="text"
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

            <stackone-hub
                ref={hubRef}
                token={token || undefined}
                base-url={baseUrl}
                mode="integration-picker"
                height="600px"
                theme={theme}
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
