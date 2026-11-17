import { useEffect, useRef, useState } from 'react'
import type { TabsUpdated, TabState } from '@shared/ipc-contract'
import { Toolbar } from './Toolbar'
import { TabStrip } from './TabStrip'

export function App(): JSX.Element {
  const [tabs, setTabs] = useState<TabState[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const chromeRef = useRef<HTMLDivElement>(null)

  const active = tabs.find((t) => t.id === activeId) ?? null

  // Subscribe to tab-state pushes from the main process.
  useEffect(() => {
    const off = window.ziva.onTabsUpdated((state: TabsUpdated) => {
      setTabs(state.tabs)
      setActiveId(state.activeId)
    })
    return off
  }, [])

  // Tell main how tall the chrome is, so it can size the web content view to
  // fill the space below. Re-measure on resize.
  useEffect(() => {
    const report = () => {
      const h = chromeRef.current?.offsetHeight ?? 88
      window.ziva.setChromeBounds(h)
    }
    report()
    window.addEventListener('resize', report)
    return () => window.removeEventListener('resize', report)
  }, [tabs.length])

  return (
    <div className="flex h-full flex-col bg-[#0b0b0f] text-zinc-200">
      <div ref={chromeRef} className="select-none">
        <TabStrip
          tabs={tabs}
          activeId={activeId}
          onActivate={(id) => window.ziva.tabActivate(id)}
          onClose={(id) => window.ziva.tabClose(id)}
          onNew={() => window.ziva.tabCreate()}
        />
        <Toolbar active={active} />
      </div>

      {/* The web page itself renders in a native view layered below this
          chrome by the main process, so there is no content element here —
          just the empty space it fills. */}
      <div className="flex-1" />
    </div>
  )
}
