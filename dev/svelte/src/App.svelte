<script lang="ts">
    const TOKEN_KEY = 'stackone-hub-token';
    const BASE_URL_KEY = 'stackone-hub-base-url';

    let token = $state(localStorage.getItem(TOKEN_KEY) ?? '');
    let baseUrl = $state(localStorage.getItem(BASE_URL_KEY) ?? 'https://api.stackone.com');
    let theme = $state<'light' | 'dark'>('light');
    let events = $state<{ at: string; label: string; detail?: unknown }[]>([]);
    let hubEl: HTMLElement | undefined = $state();

    $effect(() => {
        localStorage.setItem(TOKEN_KEY, token);
    });
    $effect(() => {
        localStorage.setItem(BASE_URL_KEY, baseUrl);
    });

    const apiKey = import.meta.env.VITE_STACKONE_API_KEY as string | undefined;
    const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://api.stackone.com';
    const apiHost = (() => {
        try {
            return new URL(apiUrl).hostname;
        } catch {
            return '';
        }
    })();
    const isLocalhost = apiHost === 'localhost' || apiHost === '127.0.0.1';
    if (apiKey && !token && !isLocalhost) {
        console.warn(
            `Skipping connect_sessions auto-fetch — "${apiUrl}" is not localhost. Paste a pre-minted token.`,
        );
    } else if (apiKey && !token) {
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
                if (body?.token) token = body.token;
            })
            .catch((err) => console.warn('connect_sessions failed', err));
    }

    const log = (label: string, detail?: unknown) => {
        events = [{ at: new Date().toLocaleTimeString(), label, detail }, ...events];
    };

    $effect(() => {
        if (!hubEl) return;
        const onSuccess = (event: Event) => log('success', (event as CustomEvent).detail);
        const onClose = () => log('close');
        hubEl.addEventListener('success', onSuccess);
        hubEl.addEventListener('close', onClose);
        return () => {
            hubEl?.removeEventListener('success', onSuccess);
            hubEl?.removeEventListener('close', onClose);
        };
    });

    const setTheme = (next: 'light' | 'dark') => {
        theme = next;
    };
</script>

<header>
    <h1>stackone-hub — Svelte 5</h1>
    <p>Svelte 5 + Vite. Custom elements work natively, no config.</p>
</header>

<section class="controls">
    <label>
        Token
        <input bind:value={token} name="token" type="text" placeholder="paste connect-session token" />
    </label>
    <label>
        Base URL
        <input bind:value={baseUrl} name="baseUrl" type="text" />
    </label>
    <div class="row">
        <button type="button" onclick={() => setTheme('light')}>Light</button>
        <button type="button" onclick={() => setTheme('dark')}>Dark</button>
    </div>
</section>

<stackone-hub
    bind:this={hubEl}
    token={token || null}
    base-url={baseUrl}
    mode="integration-picker"
    height="600px"
    {theme}
></stackone-hub>

<section class="events">
    <h2>Event log</h2>
    <ol>
        {#each events as event, i (i)}
            <li>
                [{event.at}] {event.label}
                {#if event.detail} — {JSON.stringify(event.detail)}{/if}
            </li>
        {/each}
    </ol>
</section>

<style>
    :global(*) { box-sizing: border-box; }
    :global(body) {
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        max-width: 880px;
        margin: 24px auto;
        padding: 0 16px;
        color: #1a1a1a;
    }
    header h1 { margin: 0 0 4px; font-size: 20px; }
    header p { margin: 0 0 24px; color: #666; font-size: 14px; }
    .controls { display: grid; gap: 12px; margin-bottom: 24px; }
    .controls label { display: grid; gap: 4px; font-size: 13px; color: #444; }
    .controls input { padding: 8px 10px; border: 1px solid #d4d4d4; border-radius: 6px; font-size: 14px; }
    .row { display: flex; gap: 8px; }
    button { padding: 6px 12px; border: 1px solid #d4d4d4; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; }
    button:hover { background: #f5f5f5; }
    stackone-hub { display: block; margin-bottom: 24px; }
    .events h2 { font-size: 14px; margin: 0 0 8px; color: #444; }
    .events ol { list-style: none; padding: 0; margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; max-height: 200px; overflow-y: auto; border: 1px solid #eee; border-radius: 6px; background: #fafafa; }
    .events li { padding: 6px 10px; border-bottom: 1px solid #eee; }
    .events li:last-child { border-bottom: none; }
</style>
