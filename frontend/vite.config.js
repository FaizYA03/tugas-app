import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  // Base path dinamis: workflow GitHub Pages mengisi PAGES_BASE=/nama-repo/
  // agar aset termuat benar di project site. Lokal/docker tetap '/'.
  base: process.env.PAGES_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
  },
});
