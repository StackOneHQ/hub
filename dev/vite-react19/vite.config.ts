import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    envDir: '..',
    plugins: [react()],
    resolve: {
        dedupe: ['react', 'react-dom', 'react-hook-form'],
    },
    server: {
        port: 3015,
    },
});
