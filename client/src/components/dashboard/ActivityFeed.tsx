import { formatDistanceToNow } from 'date-fns'
import StatusBadge from '@/components/shared/StatusBadge'

export interface ActivityItem {
  id: string
  title: string
  subtitle: string
  status?: string
  timestamp?: string
}

export default function ActivityFeed({
  title,
  items,
}: {
  title: string
  items: ActivityItem[]
}) {
  return (
    <div className="card">
      <h3 style={{ fontFamily: 'Sora', fontSize: 15, fontWeight: 600, marginBottom: 18 }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
        {/* Timeline line */}
        <div
          style={{
            position: 'absolute',
            left: 7,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'linear-gradient(180deg, var(--accent-primary), transparent)',
            borderRadius: 1,
            zIndex: 0,
          }}
        />
        
        {items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              padding: '14px 0 14px 24px',
              borderBottom: idx < items.length - 1 ? '1px solid var(--border-default)' : 'none',
              position: 'relative',
            }}
          >
            {/* Timeline dot */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 18,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: item.status ? 'rgba(108,99,255,0.4)' : 'rgba(148,163,184,0.2)',
                border: '2px solid var(--bg-primary)',
                zIndex: 1,
              }}
            />

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                {item.subtitle}
              </div>
              {item.timestamp ? (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </div>
              ) : null}
            </div>
            {item.status ? <StatusBadge status={item.status} /> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
