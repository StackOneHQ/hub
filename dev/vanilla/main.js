const TOKEN_KEY = 'stackone-hub-token';
const BASE_URL_KEY = 'stackone-hub-base-url';

const hub = document.getElementById('hub');
const tokenInput = document.getElementById('token');
const baseUrlInput = document.getElementById('base-url');
const eventLog = document.getElementById('event-log');

const storedToken = localStorage.getItem(TOKEN_KEY) ?? '';
const storedBaseUrl = localStorage.getItem(BASE_URL_KEY);

tokenInput.value = storedToken;
if (storedBaseUrl) {
    baseUrlInput.value = storedBaseUrl;
}

const applyAttributes = () => {
    if (tokenInput.value) {
        hub.setAttribute('token', tokenInput.value);
    } else {
        hub.removeAttribute('token');
    }
    hub.setAttribute('base-url', baseUrlInput.value);
};
applyAttributes();

tokenInput.addEventListener('input', () => {
    localStorage.setItem(TOKEN_KEY, tokenInput.value);
    applyAttributes();
});
baseUrlInput.addEventListener('input', () => {
    localStorage.setItem(BASE_URL_KEY, baseUrlInput.value);
    applyAttributes();
});

document.getElementById('theme-light').addEventListener('click', () => {
    hub.setAttribute('theme', 'light');
});
document.getElementById('theme-dark').addEventListener('click', () => {
    hub.setAttribute('theme', 'dark');
});

const log = (label, detail) => {
    const li = document.createElement('li');
    const time = new Date().toLocaleTimeString();
    li.textContent = `[${time}] ${label}${detail ? ` — ${JSON.stringify(detail)}` : ''}`;
    eventLog.prepend(li);
};

hub.addEventListener('success', (event) => log('success', event.detail));
hub.addEventListener('close', () => log('close'));
