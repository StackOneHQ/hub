import '@stackone/hub/webcomponent';
import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) {
    throw new Error('#app element not found');
}
mount(App, { target });
