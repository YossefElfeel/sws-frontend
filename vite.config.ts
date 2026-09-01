import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  root: 'prototype',
  publicDir: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./prototype/src', import.meta.url)),
    },
  },
  // world.css imports tokens/dist/tokens.css by relative path, which sits outside the Vite
  // root. Allowing the repo root keeps that single generated file as the only source of
  // design values rather than copying it into the prototype.
  optimizeDeps: { entries: ['src/main.tsx'] },
  server: { port: 5173, strictPort: false },
  build: { outDir: '../dist-prototype', emptyOutDir: true },
});
