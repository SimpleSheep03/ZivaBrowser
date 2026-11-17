import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Anchor everything to the project root. electron-vite always runs with the
// project root as cwd, and unlike `__dirname` this is identical whether the
// config is loaded as CommonJS or ES module — which avoids the
// "entry point is required" failure that happens when `__dirname` comes
// through undefined under native-ESM config loading on some setups.
const root = process.cwd()
const r = (...p: string[]): string => resolve(root, ...p)

const shared = { alias: { '@shared': r('src/shared') } }

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      rollupOptions: { input: { index: r('src/main/index.ts') } }
    },
    resolve: shared
  },
  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: { input: { index: r('src/preload/index.ts') } }
    },
    resolve: shared
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: 'out/renderer',
      rollupOptions: { input: { index: r('src/renderer/index.html') } }
    },
    resolve: shared,
    plugins: [react()]
  }
})
