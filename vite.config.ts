import 'dotenv/config';
import { defineConfig, Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    async configureServer(server) {
      const express = (await import('express')).default;
      const { createApiRouter } = await import('./src/server/apiRouter');
      const apiApp = express();
      apiApp.use('/api', createApiRouter());

      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api')) {
          apiApp(req as any, res as any, next);
        } else {
          next();
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), tailwindcss(), apiDevServerPlugin()],
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['lucide-react', 'recharts', 'clsx', 'tailwind-merge']
          }
        }
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      watch: {
        ignored: [
          '**/data/**',
          '**/dist/**',
          '**/.git/**',
          '**/database.json',
          '**/*.sqlite',
          '**/*.sqlite-journal',
          '**/*.db'
        ]
      }
    }
  };
});
