import StatusBadge from '@/components/shared/StatusBadge'
import type { ComplaintStatus } from '@/types'

const order: ComplaintStatus[] = [
  'PENDING',
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
]

export default function StatusTracker({ status }: { status: ComplaintStatus }) {
  const currentIndex = order.indexOf(status)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontFamily: 'Sora', fontSize: 15, margin: 0, fontWeight: 600 }}>Resolution Progress</h3>
        <StatusBadge status={status} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
        {/* Connection line */}
        <div
          style={{
            position: 'absolute',
            top: 5,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, var(--accent-primary), transparent)',
            borderRadius: 1,
            zIndex: 0,
          }}
        />
        
        {order.map((step, index) => {
          const active = currentIndex >= index
          const isRejected = status === 'REJECTED' && step === 'REJECTED'
          const isCurrent = status === step
          
          return (
            <div key={step} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  margin: '0 auto 10px',
                  background: isRejected
                    ? 'var(--accent-danger)'
                    : active
                    ? 'var(--accent-primary)'
                    : 'rgba(148,163,184,0.2)',
                  border: isCurrent ? '3px solid var(--bg-primary)' : 'none',
                  boxShadow: isCurrent ? '0 0 12px var(--accent-primary)' : 'none',
                  transition: 'all 0.3s',
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: isCurrent ? 600 : 500,
                  letterSpacing: '0.3px',
                }}
              >
                {step.replaceAll('_', ' ')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
