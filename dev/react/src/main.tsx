import '@stackone/hub/webcomponent';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';

const root = document.getElementById('root');
if (!root) {
    throw new Error('#root element not found');
}
createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
