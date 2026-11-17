# Ziva — minimal browser stage

A transparent Chromium-based browser built on Electron + React + TypeScript.
This is the first stage: a working tabbed browser on a secure process
architecture. Assistant features (voice, OCR, auto-typer) come in later stages.

> This build intentionally does **not** include any screen-capture-evasion or
> "invisible to screen sharing" behaviour.

## Run it

```bash
npm install
npm run dev        # launches Ziva with hot reload
```

Other scripts:

```bash
npm run typecheck  # type-check main + renderer
npm run build      # build all three bundles into out/
npm start          # preview the production build
npx tsx tests/resolve-input.test.ts   # run the address-bar unit test
```

Requires Node 18+ and a desktop environment (it opens a real window).

## What works

- Multiple tabs (new / close / switch)
- Address bar: full URLs, bare domains (`example.com`), or a search query
- Back / forward / reload / home
- `target=_blank` and `window.open` open as new Ziva tabs
- Non-web protocols (mailto:, etc.) hand off to the OS

## Architecture (why it's split this way)

```
MAIN PROCESS (Node, full OS access)
  index.ts              app + window lifecycle
  window-manager/       TabManager — one WebContentsView per tab
  ipc/registry.ts       every renderer->main call, zod-validated
        │  secure IPC (validated payloads only)
  preload/index.ts      contextBridge — the ONLY API the renderer sees (window.ziva)
        │
RENDERER (sandboxed, no Node)
  shell/                React browser chrome: tab strip, toolbar
  shared/ipc-contract   zod schemas + types imported by BOTH sides
```

Security defaults everywhere web content loads:
`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
The renderer has no `require` and no `ipcRenderer` — only the handful of
methods exposed on `window.ziva`, each forwarding to a validated handler.

### Why `WebContentsView` instead of `<webview>` / `<iframe>`

Each tab is a native `WebContentsView` owned by the main process and layered
below the React chrome. This keeps untrusted page content fully isolated from
the UI process, and is the approach Electron now recommends over the
deprecated `<webview>` tag.

## Next stages

2. Floating assistant window + window controls
3. Global keyboard shortcuts (configurable)
4. Screenshot + OCR
5. Audio capture → VAD → silence detection → segmentation (the core feature)
6. Speech-to-text provider abstraction (Gemini / pluggable STT)
7. Auto-typer
8. Settings dashboard + SQLite persistence
9. Windows packaging (electron-builder)
```
