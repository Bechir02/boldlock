import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/web',
  base: '/boldlock/',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: false
  }
});
