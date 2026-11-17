import { app, BrowserWindow, session } from 'electron'
import { join } from 'node:path'
import { Channels } from '@shared/ipc-contract'
import { TabManager } from './window-manager/tab-manager'
import { registerIpc } from './ipc/registry'

let mainWindow: BrowserWindow | null = null
let tabs: TabManager | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 640,
    minHeight: 480,
    backgroundColor: '#0b0b0f',
    autoHideMenuBar: true,
    title: 'Ziva',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // The chrome renderer is OUR code but still runs locked down:
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  tabs = new TabManager(mainWindow, (state) => {
    // Push tab state to the chrome renderer whenever anything changes.
    mainWindow?.webContents.send(Channels.TabsUpdated, state)
  })
  registerIpc(tabs)

  // Load the React chrome. electron-vite serves it on a dev URL in `dev`,
  // and emits a built index.html for production.
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    mainWindow.loadURL(devUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    tabs?.create() // open the first tab
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    tabs = null
  })
}

// A strict Content-Security-Policy for OUR chrome document (not the web tabs,
// which are isolated views). Blocks remote script injection into the shell.
function applyChromeCsp(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    cb({ responseHeaders: details.responseHeaders })
  })
}

app.whenReady().then(() => {
  applyChromeCsp()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
