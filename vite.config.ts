import react from '@vitejs/plugin-react-swc';
import relay from 'vite-plugin-relay';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        relay,
        react(),
        {
          name: 'custom-headers',
          configureServer(server) {
            server.middlewares.use((_req, res, next) => {
              res.setHeader('cross-origin-opener-policy', 'same-origin');
              next();
            });
          },
        },
    ],
    server: {
        port: 3000,
        // hmr: true,
        headers: {
            'cross-origin-opener-policy': 'same-origin',
        }
    },
    root: 'dev',
});
