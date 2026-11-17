import { useEffect, useState } from 'react'
import type { TabState } from '@shared/ipc-contract'

interface Props {
  active: TabState | null
}

/**
 * Address bar + navigation controls. The input is "controlled but
 * overridable": it mirrors the active tab's URL, except while the user is
 * editing it (so typing isn't clobbered by background navigation events).
 */
export function Toolbar({ active }: Props): JSX.Element {
  const [value, setValue] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) setValue(active?.url ?? '')
  }, [active?.url, editing])

  const id = active?.id

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    window.ziva.navGoto(id, value)
    setEditing(false)
    ;(e.target as HTMLFormElement).querySelector('input')?.blur()
  }

  const Btn = ({
    label,
    onClick,
    disabled
  }: {
    label: string
    onClick: () => void
    disabled?: boolean
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 rounded-md text-zinc-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent"
    >
      {label}
    </button>
  )

  return (
    <div className="flex items-center gap-2 bg-[#0b0b0f] px-3 py-2">
      <Btn label="←" onClick={() => id && window.ziva.navBack(id)} disabled={!active?.canGoBack} />
      <Btn
        label="→"
        onClick={() => id && window.ziva.navForward(id)}
        disabled={!active?.canGoForward}
      />
      <Btn label={active?.loading ? '✕' : '⟳'} onClick={() => id && window.ziva.navReload(id)} />
      <Btn label="⌂" onClick={() => id && window.ziva.navHome(id)} />

      <form onSubmit={submit} className="flex-1">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => {
            setEditing(true)
            e.target.select()
          }}
          onBlur={() => setEditing(false)}
          placeholder="Search or enter address"
          spellCheck={false}
          className="w-full rounded-full bg-[#1d1d24] px-4 py-1.5 text-sm text-zinc-100 outline-none ring-1 ring-white/5 focus:ring-indigo-500/60"
        />
      </form>
    </div>
  )
}
