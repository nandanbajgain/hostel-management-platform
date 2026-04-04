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
        <div style={{ display: 'grid', gap: 16 }}>
          {complaints.map((complaint) => (
            <div key={complaint.id} className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  alignItems: 'flex-start',
                  marginBottom: 14,
                }}
              >
                <div>
                  <div style={{ fontFamily: 'Sora', fontSize: 18 }}>{complaint.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {complaint.category} · Token {complaint.token}
                  </div>
                </div>
                <StatusBadge status={complaint.status} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65 }}>
                {complaint.description}
              </p>
              {complaint.adminNote ? (
                <div
                  style={{
                    marginTop: 14,
                    padding: '0.9rem 1rem',
                    background: 'rgba(34,211,238,0.08)',
                    border: '1px solid rgba(34,211,238,0.16)',
                    borderRadius: 10,
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                  }}
                >
                  <strong style={{ color: 'var(--accent-secondary)' }}>Admin note:</strong>{' '}
                  {complaint.adminNote}
                </div>
              ) : null}
              <div className="card" style={{ marginTop: 16, padding: '1.25rem' }}>
                <StatusTracker status={complaint.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
