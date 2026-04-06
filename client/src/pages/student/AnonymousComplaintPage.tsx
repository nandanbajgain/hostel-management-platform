import { EyeOff } from 'lucide-react'
import AnonymousForm from '@/components/complaints/AnonymousForm'

export default function AnonymousComplaintPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(108,99,255,0.1)',
          border: '1px solid rgba(108,99,255,0.25)',
        }}
      >
        <EyeOff size={18} color="var(--accent-primary)" />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Your identity is <strong style={{ color: 'var(--text-primary)' }}>never stored</strong>{' '}
          with this complaint. You will get an anonymous tracking token.
        </span>
      </div>

      <div>
        <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0 }}>Report Anonymously</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Use this only to report a student/staff issue. A proof photo is required. For cleaning/plumbing/electrical, use Maintenance.
        </p>
      </div>

      <AnonymousForm />
    </div>
  )
}
