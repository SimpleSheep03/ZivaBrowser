import { ipcMain, type WebContents } from 'electron'
import { z } from 'zod'
import {
  Channels,
  TabIdSchema,
  NavGotoSchema,
  ChromeBoundsSchema
} from '@shared/ipc-contract'
import type { TabManager } from '../window-manager/tab-manager'

/**
 * A thin wrapper around ipcMain.handle that validates the payload with a zod
 * schema BEFORE the handler runs. If validation fails we throw — the error
 * surfaces as a rejected promise in the renderer instead of running the
 * handler on malformed/malicious input. This is the single choke point where
 * all renderer->main input is checked.
 */
function handle<S extends z.ZodTypeAny>(
  channel: string,
  schema: S,
  fn: (payload: z.infer<S>, sender: WebContents) => unknown
): void {
  ipcMain.handle(channel, (event, raw) => {
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      throw new Error(`IPC ${channel}: invalid payload — ${parsed.error.message}`)
    }
    return fn(parsed.data, event.sender)
  })
}

export function registerIpc(tabs: TabManager): void {
  handle(Channels.TabCreate, z.object({ url: z.string().optional() }), (p) =>
    tabs.create(p.url)
  )
  handle(Channels.TabClose, TabIdSchema, (p) => tabs.close(p.id))
  handle(Channels.TabActivate, TabIdSchema, (p) => tabs.activate(p.id))
  handle(Channels.NavGoto, NavGotoSchema, (p) => tabs.goto(p.id, p.input))
  handle(Channels.NavBack, TabIdSchema, (p) => tabs.back(p.id))
  handle(Channels.NavForward, TabIdSchema, (p) => tabs.forward(p.id))
  handle(Channels.NavReload, TabIdSchema, (p) => tabs.reload(p.id))
  handle(Channels.NavHome, TabIdSchema, (p) => tabs.home(p.id))
  handle(Channels.ChromeBounds, ChromeBoundsSchema, (p) => tabs.setChromeTop(p.top))
}
