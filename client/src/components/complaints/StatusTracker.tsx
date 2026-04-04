import StatusBadge from '@/components/shared/StatusBadge'
import type { ComplaintStatus } from '@/types'

const order = ['PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED']

export default function StatusTracker({ status }: { status: ComplaintStatus }) {
  const currentIndex = order.indexOf(status)

  return (
    <div style={{ padding: '0.25rem 0.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'Sora', fontSize: 15, margin: 0 }}>Progress</h3>
        <StatusBadge status={status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {order.map((step, index) => {
          const active = currentIndex >= index || status === 'REJECTED'
          return (
            <div key={step} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  margin: '0 auto 8px',
                  background:
                    status === 'REJECTED'
                      ? index === currentIndex
                        ? 'var(--accent-danger)'
                        : 'rgba(148,163,184,0.3)'
                      : active
                      ? 'var(--accent-primary)'
                      : 'rgba(148,163,184,0.25)',
                }}
              />
              <div style={{ fontSize: 11, color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {step.replaceAll('_', ' ')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
