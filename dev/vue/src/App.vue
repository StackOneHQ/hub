<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from 'vue';

const TOKEN_KEY = 'stackone-hub-token';
const BASE_URL_KEY = 'stackone-hub-base-url';

const token = ref(localStorage.getItem(TOKEN_KEY) ?? '');
const baseUrl = ref(localStorage.getItem(BASE_URL_KEY) ?? 'https://api.stackone.com');
const theme = ref<'light' | 'dark'>('light');
const events = ref<{ at: string; label: string; detail?: unknown }[]>([]);

const hubRef = useTemplateRef<HTMLElement>('hub');

watch(token, (value) => localStorage.setItem(TOKEN_KEY, value));
watch(baseUrl, (value) => localStorage.setItem(BASE_URL_KEY, value));

const apiKey = import.meta.env.VITE_STACKONE_API_KEY;
const apiUrl = import.meta.env.VITE_API_URL ?? 'https://api.stackone.com';
const apiHost = (() => {
    try {
        return new URL(apiUrl).hostname;
    } catch {
        return '';
    }
})();
const isLocalhost = apiHost === 'localhost' || apiHost === '127.0.0.1';
if (apiKey && !token.value && !isLocalhost) {
    console.warn(
        `Skipping connect_sessions auto-fetch — "${apiUrl}" is not localhost. Paste a pre-minted token.`,
    );
} else if (apiKey && !token.value) {
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
                token.value = body.token;
            }
        })
        .catch((err) => console.warn('connect_sessions failed', err));
}

const log = (label: string, detail?: unknown) => {
    events.value.unshift({ at: new Date().toLocaleTimeString(), label, detail });
};

onMounted(() => {
    const el = hubRef.value;
    if (!el) return;
    el.addEventListener('success', (event: Event) => {
        log('success', (event as CustomEvent).detail);
    });
    el.addEventListener('close', () => log('close'));
});

const setTheme = (next: 'light' | 'dark') => {
    theme.value = next;
};
</script>

<template>
    <header>
        <h1>stackone-hub — Vue 3</h1>
        <p>Vite + <code>isCustomElement</code>. Events via <code>addEventListener</code>.</p>
    </header>

    <section class="controls">
        <label>
            Token
            <input v-model="token" type="text" placeholder="paste connect-session token" />
        </label>
        <label>
            Base URL
            <input v-model="baseUrl" type="text" />
        </label>
        <div class="row">
            <button type="button" @click="setTheme('light')">Light</button>
            <button type="button" @click="setTheme('dark')">Dark</button>
        </div>
    </section>

    <stackone-hub
        ref="hub"
        :token="token || null"
        :base-url="baseUrl"
        mode="integration-picker"
        height="600px"
        :theme="theme"
    ></stackone-hub>

    <section class="events">
        <h2>Event log</h2>
        <ol>
            <li v-for="(event, i) in events" :key="i">
                [{{ event.at }}] {{ event.label }}
                <span v-if="event.detail"> — {{ JSON.stringify(event.detail) }}</span>
            </li>
        </ol>
    </section>
</template>

<style>
* { box-sizing: border-box; }
body {
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
