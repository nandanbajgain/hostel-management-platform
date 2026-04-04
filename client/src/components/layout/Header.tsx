import { Bell, CalendarDays, Command, Menu, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import CommandPalette from './CommandPalette'
import NotificationsDrawer from './NotificationsDrawer'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUIStore } from '@/store/uiStore'

export default function Header() {
  const { user } = useAuthStore()
  const { unreadCount, markAllRead } = useNotificationStore()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 900px)')
  const { setMobileSidebarOpen } = useUIStore()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === 'k'
      if ((event.ctrlKey || event.metaKey) && isK) {
        event.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backdropFilter: 'blur(14px)',
        background: 'rgba(10,15,30,0.75)',
        borderBottom: '1px solid var(--border-default)',
        padding: '1rem 2rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile ? (
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open menu"
              className="card-glass"
              style={{
                width: 42,
                height: 42,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              <Menu size={18} color="var(--text-primary)" />
            </button>
          ) : null}

          <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--accent-secondary)',
              fontSize: 12,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
            }}
          >
            <Sparkles size={12} />
            Hostel Operations
          </div>
          <h2 style={{ fontFamily: 'Sora', fontSize: 20, margin: 0 }}>
            {user ? `Welcome, ${user.name.split(' ')[0]}` : 'Hostel Portal'}
          </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div
            className="card-glass"
            style={{
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 220,
              cursor: 'pointer',
            }}
            role="button"
            tabIndex={0}
            onClick={() => setPaletteOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setPaletteOpen(true)
            }}
          >
            <Command size={16} color="var(--text-tertiary)" />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
              Search pages and actions
            </span>
            {!isMobile ? (
              <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: 'var(--text-tertiary)',
                padding: '3px 8px',
                border: '1px solid var(--border-default)',
                borderRadius: 999,
              }}
            >
              Ctrl K
              </span>
            ) : null}
          </div>

          <div className="card-glass" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={16} color="var(--accent-secondary)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {format(new Date(), 'EEE, dd MMM yyyy')}
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              className="card-glass"
              onClick={() => {
                setNotifsOpen(true)
                markAllRead()
              }}
              aria-label="Open notifications"
              style={{
                width: 42,
                height: 42,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              <Bell size={18} color="var(--text-primary)" />
            </button>
            {unreadCount > 0 ? (
              <span
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -4,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 999,
                  background: 'var(--accent-danger)',
                  color: 'white',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingInline: 4,
                }}
              >
                {Math.min(unreadCount, 9)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {paletteOpen ? (
        <CommandPalette
          open
          onClose={() => setPaletteOpen(false)}
          onOpenNotifications={() => setNotifsOpen(true)}
        />
      ) : null}
      {notifsOpen ? (
        <NotificationsDrawer open onClose={() => setNotifsOpen(false)} />
      ) : null}
    </header>
  )
}
