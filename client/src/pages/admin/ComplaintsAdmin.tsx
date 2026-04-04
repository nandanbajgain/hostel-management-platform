import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/services/api'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusBadge from '@/components/shared/StatusBadge'
import type { Complaint, ComplaintStatus } from '@/types'
import { getErrorMessage } from '@/lib/errors'
import CardListSkeleton from '@/components/shared/CardListSkeleton'

const statuses: ComplaintStatus[] = ['PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']

export default function ComplaintsAdmin() {
  const [filter, setFilter] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const complaintsQuery = useQuery({
    queryKey: ['admin-complaints', filter],
    queryFn: () =>
      api
        .get('/complaints', { params: filter ? { status: filter } : undefined })
        .then((res) => res.data as Complaint[]),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: ComplaintStatus; adminNote?: string }) =>
      api.patch(`/complaints/${id}/status`, { status, adminNote }),
    onSuccess: () => {
      toast.success('Complaint updated')
      complaintsQuery.refetch()
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error, 'Could not update complaint')),
  })

  if (complaintsQuery.isLoading) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <LoadingSpinner />
        <CardListSkeleton rows={4} height={160} />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0 }}>Complaints Admin</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Review, assign status, and communicate updates to students.
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {(complaintsQuery.data || []).map((complaint) => (
          <div key={complaint.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'Sora', fontSize: 18 }}>{complaint.title}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>
                  {complaint.isAnonymous ? 'Anonymous complaint' : complaint.user?.name} ·{' '}
                  {complaint.category}
                </div>
              </div>
              <StatusBadge status={complaint.status} />
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 16 }}>
              {complaint.description}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 140px', gap: 12, marginTop: 16 }}>
              <select
                defaultValue={complaint.status}
                onChange={(e) =>
                  updateMutation.mutate({
                    id: complaint.id,
                    status: e.target.value as ComplaintStatus,
                    adminNote: notes[complaint.id],
                  })
                }
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
              <input
                value={notes[complaint.id] ?? complaint.adminNote ?? ''}
                onChange={(e) =>
                  setNotes((state) => ({
                    ...state,
                    [complaint.id]: e.target.value,
                  }))
                }
                placeholder="Admin note"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                className="btn-primary"
                onClick={() =>
                  updateMutation.mutate({
                    id: complaint.id,
                    status: complaint.status,
                    adminNote: notes[complaint.id],
                  })
                }
              >
                Save Note
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
