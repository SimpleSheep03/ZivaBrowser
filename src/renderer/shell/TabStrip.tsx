import type { TabState } from '@shared/ipc-contract'

interface Props {
  tabs: TabState[]
  activeId: string | null
  onActivate: (id: string) => void
  onClose: (id: string) => void
  onNew: () => void
}

export function TabStrip({ tabs, activeId, onActivate, onClose, onNew }: Props): JSX.Element {
  return (
    <div className="flex items-center gap-1 overflow-x-auto bg-[#141419] px-2 pt-2">
      {tabs.map((t) => {
        const active = t.id === activeId
        return (
          <div
            key={t.id}
            onClick={() => onActivate(t.id)}
            className={[
              'group flex min-w-[140px] max-w-[220px] cursor-default items-center gap-2 rounded-t-lg px-3 py-2 text-sm',
              active ? 'bg-[#0b0b0f] text-white' : 'bg-[#1d1d24] text-zinc-400 hover:bg-[#23232b]'
            ].join(' ')}
            title={t.title}
          >
            <span className="flex-1 truncate">
              {t.loading ? '…' : ''} {t.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose(t.id)
              }}
              className="rounded px-1 text-zinc-500 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100"
              aria-label="Close tab"
            >
              ✕
            </button>
          </div>
        )
      })}
      <button
        onClick={onNew}
        className="ml-1 rounded px-2 py-1 text-lg text-zinc-400 hover:bg-white/10 hover:text-white"
        aria-label="New tab"
      >
        +
      </button>
    </div>
  )
}
