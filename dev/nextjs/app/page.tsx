import HubWrapper from './HubWrapper';

function isSafeApiUrl(rawUrl: string): boolean {
    try {
        const url = new URL(rawUrl);
        if (url.protocol === 'https:') return true;
        if (
            url.protocol === 'http:' &&
            (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
        ) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

async function fetchToken(): Promise<string | null> {
    const apiKey = process.env.STACKONE_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.stackone.com';
    if (!apiKey) return null;
    if (!isSafeApiUrl(apiUrl)) {
        console.warn(
            `[hub-nextjs-sandbox] refusing to send API key — NEXT_PUBLIC_API_URL must be https or localhost (got ${apiUrl})`,
        );
        return null;
    }

    try {
        const res = await fetch(`${apiUrl}/connect_sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(apiKey).toString('base64')}`,
            },
            body: JSON.stringify({
                metadata: { source: 'hub-nextjs-sandbox' },
                origin_owner_id: process.env.ORIGIN_OWNER_ID ?? 'dummy_customer_id',
                origin_owner_name: process.env.ORIGIN_OWNER_NAME ?? 'dummy_customer_name',
                origin_username: process.env.ORIGIN_USERNAME ?? 'dummy_customer_username',
            }),
            cache: 'no-store',
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { token?: string };
        return data.token ?? null;
    } catch {
        return null;
    }
}

export default async function Page() {
    const token = await fetchToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.stackone.com';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.stackone.com';

    return (
        <main style={{ maxWidth: 720, margin: '0 auto' }}>
            <h1>StackOne Hub — Next.js (App Router) Sandbox</h1>
            <p style={{ color: '#555' }}>
                This page is a Server Component. The token is created server-side; the Hub renders
                inside a Client Component below.
            </p>
            <HubWrapper initialToken={token ?? ''} apiUrl={apiUrl} appUrl={appUrl} />
        </main>
    );
}
