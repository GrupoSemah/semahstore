// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
// Import Vercel adapter with the correct serverless target
import vercel from '@astrojs/vercel/serverless';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: true
    }
  }),
  // Configuración para resolver correctamente archivos JavaScript
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('./src')
      },
      extensions: ['.js', '.mjs', '.jsx', '.ts', '.tsx']
    }
  }
});