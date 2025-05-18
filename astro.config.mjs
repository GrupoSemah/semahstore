// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
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