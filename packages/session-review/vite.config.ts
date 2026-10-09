import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    target: 'es2023',
    lib: {
      entry: fileURLToPath(new URL('src/main.tsx', import.meta.url)),
      formats: ['es'],
      fileName: 'review',
    },
    cssCodeSplit: false,
    rolldownOptions: { output: { codeSplitting: false } },
  },
});
