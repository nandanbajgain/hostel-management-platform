import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, X } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'

function typeColor(type: string) {
  if (type === 'success') return 'var(--accent-success)'
  if (type === 'warning') return 'var(--accent-warning)'
  if (type === 'error') return 'var(--accent-danger)'
  return 'var(--accent-secondary)'
}

export default function NotificationsDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { notifications, markAllRead, markRead } = useNotificationStore()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 260,
        background: 'rgba(0,0,0,0.35)',
      }}
    >
      <aside
        className="card-glass"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: 'min(420px, 92vw)',
          borderRadius: 0,
          borderLeft: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: 'rgba(34,211,238,0.12)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Bell size={16} color="var(--accent-secondary)" />
          </div>
          <div style={{ fontWeight: 700 }}>Notifications</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={markAllRead}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                border: '1px solid var(--border-default)',
                padding: '6px 10px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
            <button
              onClick={onClose}
              aria-label="Close notifications"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: 10, overflowY: 'auto', flex: 1 }}>
          {notifications.length === 0 ? (
            <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: '1px solid var(--border-default)',
                  background: n.isRead ? 'transparent' : 'rgba(108,99,255,0.08)',
                  borderRadius: 14,
                  padding: '12px 12px',
                  cursor: 'pointer',
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      marginTop: 4,
                      background: n.isRead ? 'rgba(148,163,184,0.35)' : typeColor(n.type),
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{n.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
                      {n.message}
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 8 }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>,
    document.body
  )
}

