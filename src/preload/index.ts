import { contextBridge, ipcRenderer } from 'electron'
import { Channels, type ZivaApi, type TabsUpdated } from '@shared/ipc-contract'

/**
 * This is the ENTIRE surface the renderer can reach. The renderer has no
 * `require`, no Node, no ipcRenderer — only the methods below, exposed on
 * `window.ziva`. Each one forwards to a validated main-process handler.
 *
 * contextBridge deep-clones arguments across the isolation boundary, so the
 * renderer can never hand the main process a live function or prototype to
 * exploit — only plain data.
 */
const api: ZivaApi = {
  tabCreate: (url) => ipcRenderer.invoke(Channels.TabCreate, { url }),
  tabClose: (id) => ipcRenderer.invoke(Channels.TabClose, { id }),
  tabActivate: (id) => ipcRenderer.invoke(Channels.TabActivate, { id }),
  navGoto: (id, input) => ipcRenderer.invoke(Channels.NavGoto, { id, input }),
  navBack: (id) => ipcRenderer.invoke(Channels.NavBack, { id }),
  navForward: (id) => ipcRenderer.invoke(Channels.NavForward, { id }),
  navReload: (id) => ipcRenderer.invoke(Channels.NavReload, { id }),
  navHome: (id) => ipcRenderer.invoke(Channels.NavHome, { id }),
  setChromeBounds: (top) => ipcRenderer.invoke(Channels.ChromeBounds, { top }),
  onTabsUpdated: (cb) => {
    const listener = (_e: unknown, state: TabsUpdated) => cb(state)
    ipcRenderer.on(Channels.TabsUpdated, listener)
    return () => ipcRenderer.removeListener(Channels.TabsUpdated, listener)
  }
}

contextBridge.exposeInMainWorld('ziva', api)
