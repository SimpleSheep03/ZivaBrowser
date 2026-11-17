import { z } from 'zod'

/**
 * The IPC contract lives in `shared/` so BOTH the main process and the
 * renderer import the exact same schemas and types. The renderer uses the
 * types for autocomplete; the main process uses the schemas at runtime to
 * VALIDATE every incoming payload before acting on it. A renderer (or a
 * compromised web page that somehow reached this channel) can only ever send
 * data that matches these shapes — anything else is rejected.
 */

// ---- Channel names (string constants avoid typos across processes) ----
export const Channels = {
  // renderer -> main (invoke/handle, returns a value)
  TabCreate: 'tab:create',
  TabClose: 'tab:close',
  TabActivate: 'tab:activate',
  NavGoto: 'nav:goto',
  NavBack: 'nav:back',
  NavForward: 'nav:forward',
  NavReload: 'nav:reload',
  NavHome: 'nav:home',
  ChromeBounds: 'chrome:bounds',
  // main -> renderer (events, fire-and-forget)
  TabsUpdated: 'tabs:updated'
} as const

// ---- Payload schemas ----
export const TabIdSchema = z.object({ id: z.string().min(1) })

export const NavGotoSchema = z.object({
  id: z.string().min(1),
  // Free text from the address bar; main decides URL-vs-search.
  input: z.string().max(4096)
})

// The renderer tells main how tall the browser chrome is, so main can
// position the web content view just below it. Clamped to sane bounds.
export const ChromeBoundsSchema = z.object({
  top: z.number().int().min(0).max(2000)
})

// ---- The event payload main pushes to the renderer ----
export const TabStateSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  canGoBack: z.boolean(),
  canGoForward: z.boolean(),
  loading: z.boolean(),
  favicon: z.string().nullable()
})

export const TabsUpdatedSchema = z.object({
  tabs: z.array(TabStateSchema),
  activeId: z.string().nullable()
})

// ---- Types derived from the schemas (one source of truth) ----
export type TabState = z.infer<typeof TabStateSchema>
export type TabsUpdated = z.infer<typeof TabsUpdatedSchema>

/**
 * The shape of the API the preload script exposes on `window.ziva`.
 * Declaring it here keeps the renderer and preload in lockstep.
 */
export interface ZivaApi {
  tabCreate(url?: string): Promise<string>
  tabClose(id: string): Promise<void>
  tabActivate(id: string): Promise<void>
  navGoto(id: string, input: string): Promise<void>
  navBack(id: string): Promise<void>
  navForward(id: string): Promise<void>
  navReload(id: string): Promise<void>
  navHome(id: string): Promise<void>
  setChromeBounds(top: number): Promise<void>
  onTabsUpdated(cb: (state: TabsUpdated) => void): () => void
}
