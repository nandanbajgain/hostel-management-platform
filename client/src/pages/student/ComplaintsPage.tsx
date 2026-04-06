import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, PlusCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import ComplaintForm from '@/components/complaints/ComplaintForm'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import StatusTracker from '@/components/complaints/StatusTracker'
import api from '@/services/api'
import type { Complaint } from '@/types'
import CardListSkeleton from '@/components/shared/CardListSkeleton'

export default function ComplaintsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [openForm, setOpenForm] = useState(() => searchParams.get('new') === '1')

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    const next = new URLSearchParams(searchParams)
    next.delete('new')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])
  const complaintsQuery = useQuery({
    queryKey: ['complaints-mine'],
    queryFn: () => api.get('/complaints/mine').then((res) => res.data as Complaint[]),
  })

  if (complaintsQuery.isLoading) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <LoadingSpinner />
        <CardListSkeleton rows={3} height={160} />
      </div>
    )
  }

  const complaints = complaintsQuery.data || []

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0 }}>My Complaints</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Submit, monitor, and follow up on named complaints.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setOpenForm((state) => !state)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <PlusCircle size={16} />
          {openForm ? 'Close Form' : 'New Complaint'}
        </button>
      </div>

      {openForm ? (
        <div className="card">
          <h3 style={{ fontFamily: 'Sora', fontSize: 16, marginBottom: 16 }}>Submit Complaint</h3>
          <ComplaintForm onSuccess={() => complaintsQuery.refetch()} />
        </div>
      ) : null}

      {complaints.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No complaints yet"
          description="If something is broken or needs attention, submit a complaint and you will be able to track its progress here."
        />
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {complaints.map((complaint) => (
            <div key={complaint.id} className="card-gradient" style={{ overflow: 'hidden', position: 'relative' }}>
              {/* Background accent */}
              <div
                style={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: 'rgba(108,99,255,0.1)',
                  filter: 'blur(25px)',
                  pointerEvents: 'none',
                }}
              />
              
              <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    alignItems: 'flex-start',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'Sora', fontSize: 20, fontWeight: 600, marginBottom: 6 }}>{complaint.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-tertiary)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ background: 'rgba(108,99,255,0.2)', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                        {complaint.category}
                      </span>
                      <span>Token {complaint.token.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                  {complaint.description}
                </p>

                {complaint.adminNote ? (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: '1.25rem',
                      background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(34,211,238,0.04))',
                      border: '1px solid rgba(34,211,238,0.2)',
                      borderRadius: 12,
                      color: 'var(--text-secondary)',
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ color: 'var(--accent-secondary)', fontWeight: 600, marginBottom: 6 }}>Admin Update</div>
                    {complaint.adminNote}
                  </div>
                ) : null}

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--border-default)' }}>
                  <StatusTracker status={complaint.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
