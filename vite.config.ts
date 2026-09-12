import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this repo from https://sysper.github.io/verbs-trainer/,
// so every asset and route needs that prefix. `npm run dev` uses '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/verbs-trainer/' : '/',
  plugins: [react()],
  build: { outDir: 'dist' },
}));
