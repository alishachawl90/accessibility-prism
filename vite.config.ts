import { defineConfig } from 'vite';
import { resolve } from 'path';

// Two separate builds are needed because:
// - content.js must be IIFE (self-contained, injected into host pages)
// - panel.js must be IIFE (self-contained, loaded by panel.html)
// Rollup cannot produce IIFE from multiple entry points simultaneously
// (shared chunks break IIFE self-containment), so we build them separately.
//
// Usage:
//   npm run build         → builds both (content + panel)
//   npm run build:content → builds content.js only
//   npm run build:panel   → builds panel.js only
//   npm run dev:watch     → rebuilds both on change

const mode = process.env.BUILD_TARGET;

function contentBuild() {
  return defineConfig({
    build: {
      target: 'esnext',
      lib: {
        entry: resolve(__dirname, 'src/content.ts'),
        name: 'A11yContent',
        formats: ['iife'],
        fileName: () => 'content.js',
      },
      rollupOptions: {
        output: { extend: true },
      },
      emptyOutDir: false,
    },
  });
}

function panelBuild() {
  return defineConfig({
    build: {
      target: 'esnext',
      lib: {
        entry: resolve(__dirname, 'src/panel-ui.ts'),
        name: 'A11yPanel',
        formats: ['iife'],
        fileName: () => 'panel.js',
      },
      rollupOptions: {
        output: { extend: true },
      },
      emptyOutDir: false,
    },
  });
}

// SELECT build target via BUILD_TARGET env var
// Fallback to content build to keep `vite build` working during transition
export default mode === 'panel' ? panelBuild() : contentBuild();
