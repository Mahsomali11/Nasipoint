import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx', 'resources/js/index.css'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('recharts') || id.includes('d3-')) {
                            return 'vendor-charts';
                        }
                        if (id.includes('xlsx')) {
                            return 'vendor-xlsx';
                        }
                        if (id.includes('html5-qrcode')) {
                            return 'vendor-scanner';
                        }
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                    }
                },
            },
        },
    },
});
