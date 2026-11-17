import { WebContentsView, BrowserWindow, shell } from 'electron'
import { randomUUID } from 'node:crypto'
import type { TabState, TabsUpdated } from '@shared/ipc-contract'

const HOME_URL = 'https://duckduckgo.com'

/**
 * Turns raw address-bar text into a URL.
 *  - looks like a URL / has a scheme  -> navigate there
 *  - looks like a bare domain         -> prepend https://
 *  - otherwise                        -> treat as a search query
 */
export function resolveInput(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return HOME_URL
  if (/^[a-z]+:\/\//i.test(trimmed)) return trimmed
  const looksLikeDomain = /^[^\s]+\.[^\s]{2,}(\/.*)?$/.test(trimmed) && !trimmed.includes(' ')
  if (looksLikeDomain) return `https://${trimmed}`
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`
}

interface Tab {
  id: string
  view: WebContentsView
}

/**
 * Owns all open tabs. Each tab is a WebContentsView — a sandboxed container
 * for untrusted web content. The React "chrome" (tab strip + address bar)
 * lives in the window's own renderer; the active tab's view is layered on top,
 * positioned just below the chrome.
 */
export class TabManager {
  private tabs: Tab[] = []
  private activeId: string | null = null
  private chromeTop = 88 // px reserved for the chrome; renderer refines this

  constructor(
    private win: BrowserWindow,
    private onChange: (state: TabsUpdated) => void
  ) {
    this.win.on('resize', () => this.layoutActive())
  }

  create(url?: string): string {
    const id = randomUUID()
    const view = new WebContentsView({
      webPreferences: {
        // Hard security defaults for ALL loaded web content:
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })
    const wc = view.webContents

    // Open target=_blank / window.open in a new Ziva tab instead of a popup,
    // and never let a page open a window with Node privileges.
    wc.setWindowOpenHandler(({ url: popupUrl }) => {
      this.create(popupUrl)
      return { action: 'deny' }
    })

    // External protocols (mailto:, etc.) go to the OS, not into a tab.
    wc.on('will-navigate', (e, navUrl) => {
      if (!/^https?:\/\//i.test(navUrl)) {
        e.preventDefault()
        shell.openExternal(navUrl).catch(() => {})
      }
    })

    const emit = () => this.emitState()
    wc.on('page-title-updated', emit)
    wc.on('did-navigate', emit)
    wc.on('did-navigate-in-page', emit)
    wc.on('did-start-loading', emit)
    wc.on('did-stop-loading', emit)
    wc.on('page-favicon-updated', emit)

    this.tabs.push({ id, view })
    wc.loadURL(url ?? HOME_URL).catch(() => {})
    this.activate(id)
    return id
  }

  close(id: string): void {
    const idx = this.tabs.findIndex((t) => t.id === id)
    if (idx === -1) return
    const [tab] = this.tabs.splice(idx, 1)
    if (this.win.contentView.children.includes(tab.view)) {
      this.win.contentView.removeChildView(tab.view)
    }
    // WebContentsView cleanup
    ;(tab.view.webContents as unknown as { close?: () => void }).close?.()

    if (this.activeId === id) {
      const next = this.tabs[idx] ?? this.tabs[idx - 1]
      this.activeId = next?.id ?? null
      if (next) this.showView(next)
    }
    this.emitState()
  }

  activate(id: string): void {
    const tab = this.tabs.find((t) => t.id === id)
    if (!tab) return
    this.activeId = id
    this.showView(tab)
    this.emitState()
  }

  private showView(tab: Tab): void {
    // Detach any other attached views, attach the active one.
    for (const t of this.tabs) {
      if (t !== tab && this.win.contentView.children.includes(t.view)) {
        this.win.contentView.removeChildView(t.view)
      }
    }
    if (!this.win.contentView.children.includes(tab.view)) {
      this.win.contentView.addChildView(tab.view)
    }
    this.layoutActive()
  }

  setChromeTop(top: number): void {
    this.chromeTop = top
    this.layoutActive()
  }

  private layoutActive(): void {
    const tab = this.tabs.find((t) => t.id === this.activeId)
    if (!tab) return
    const { width, height } = this.win.getContentBounds()
    tab.view.setBounds({
      x: 0,
      y: this.chromeTop,
      width,
      height: Math.max(0, height - this.chromeTop)
    })
  }

  private withId(id: string): Tab | undefined {
    return this.tabs.find((t) => t.id === id)
  }

  goto(id: string, input: string): void {
    this.withId(id)?.view.webContents.loadURL(resolveInput(input)).catch(() => {})
  }
  back(id: string): void {
    const wc = this.withId(id)?.view.webContents
    if (wc?.navigationHistory.canGoBack()) wc.navigationHistory.goBack()
  }
  forward(id: string): void {
    const wc = this.withId(id)?.view.webContents
    if (wc?.navigationHistory.canGoForward()) wc.navigationHistory.goForward()
  }
  reload(id: string): void {
    this.withId(id)?.view.webContents.reload()
  }
  home(id: string): void {
    this.withId(id)?.view.webContents.loadURL(HOME_URL).catch(() => {})
  }

  private toState(tab: Tab): TabState {
    const wc = tab.view.webContents
    return {
      id: tab.id,
      title: wc.getTitle() || 'New Tab',
      url: wc.getURL(),
      canGoBack: wc.navigationHistory.canGoBack(),
      canGoForward: wc.navigationHistory.canGoForward(),
      loading: wc.isLoading(),
      favicon: null
    }
  }

  private emitState(): void {
    this.onChange({
      tabs: this.tabs.map((t) => this.toState(t)),
      activeId: this.activeId
    })
  }
}
