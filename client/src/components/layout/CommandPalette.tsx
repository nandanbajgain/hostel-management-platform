import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Command, LayoutDashboard, LogOut, MessageCircle, Bell, PlusCircle, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { getNavItems } from '@/lib/nav'

type CommandItem = {
  id: string
  label: string
  keywords?: string
  icon?: React.ComponentType<{ size?: number; color?: string }>
  run: () => void
}

export default function CommandPalette({
  open,
  onClose,
  onOpenNotifications,
}: {
  open: boolean
  onClose: () => void
  onOpenNotifications: () => void
}) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { user, logout } = useAuthStore()
  const { setOpen: setChatOpen } = useChatStore()
  const [query, setQuery] = useState('')
  const navItems = useMemo(() => getNavItems(user?.role), [user?.role])

  const commands = useMemo<CommandItem[]>(() => {
    const navCommands: CommandItem[] = navItems.map((item) => ({
      id: `nav:${item.to}`,
      label: item.label,
      keywords: item.to,
      icon: item.icon,
      run: () => {
        navigate(item.to)
        onClose()
      },
    }))

    const quick: CommandItem[] = [
      {
        id: 'quick:dashboard',
        label: 'Go to Dashboard',
        keywords: 'home',
        icon: LayoutDashboard,
        run: () => {
          navigate('/dashboard')
          onClose()
        },
      },
      {
        id: 'quick:complaint',
        label: 'New Complaint',
        keywords: 'issue report',
        icon: PlusCircle,
        run: () => {
          navigate('/complaints?new=1')
          onClose()
        },
      },
      {
        id: 'quick:track',
        label: 'Track Complaint',
        keywords: 'token status',
        icon: Search,
        run: () => {
          navigate('/track')
          onClose()
        },
      },
      {
        id: 'quick:chat',
        label: 'Open HostelBot',
        keywords: 'ai help',
        icon: MessageCircle,
        run: () => {
          setChatOpen(true)
          onClose()
        },
      },
      {
        id: 'quick:notifs',
        label: 'Open Notifications',
        keywords: 'bell updates',
        icon: Bell,
        run: () => {
          onOpenNotifications()
          onClose()
        },
      },
      {
        id: 'quick:logout',
        label: 'Logout',
        keywords: 'sign out',
        icon: LogOut,
        run: () => {
          logout()
          navigate('/login')
          onClose()
        },
      },
    ]

    return [...quick, ...navCommands]
  }, [navItems, navigate, logout, onClose, onOpenNotifications, setChatOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((cmd) => {
      const hay = `${cmd.label} ${cmd.keywords ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [commands, query])

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === 'k'
      if ((event.ctrlKey || event.metaKey) && isK) {
        event.preventDefault()
      }
      if (!open) return
      if (event.key === 'Escape') onClose()
      if (event.key === 'Enter' && filtered[0]) filtered[0].run()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [filtered, onClose, open])

  if (!open) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.55)',
        display: 'grid',
        placeItems: 'start center',
        paddingTop: 90,
      }}
    >
      <div
        className="card-glass"
        style={{
          width: 'min(720px, calc(100vw - 24px))',
          overflow: 'hidden',
          borderRadius: 16,
          boxShadow: '0 30px 90px rgba(0,0,0,0.55)',
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Command size={18} color="var(--text-tertiary)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and actions…"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-tertiary)',
              padding: '4px 8px',
              border: '1px solid var(--border-default)',
              borderRadius: 999,
            }}
          >
            Esc
          </span>
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 18, color: 'var(--text-secondary)', fontSize: 13 }}>
              No matches.
            </div>
          ) : (
            filtered.slice(0, 12).map((cmd) => {
              const Icon = cmd.icon
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.run}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      background: 'rgba(108,99,255,0.12)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {Icon ? <Icon size={16} color="var(--accent-primary)" /> : null}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{cmd.label}</div>
                    {cmd.keywords ? (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {cmd.keywords}
                      </div>
                    ) : null}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>↵</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
