import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/services/api'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusBadge from '@/components/shared/StatusBadge'
import type { Complaint, ComplaintStatus } from '@/types'
import { getErrorMessage } from '@/lib/errors'
import CardListSkeleton from '@/components/shared/CardListSkeleton'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const statuses: ComplaintStatus[] = ['PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']

export default function ComplaintsAdmin() {
  const isMobile = useMediaQuery('(max-width: 900px)')
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
            📋 Complaints Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
            Review and manage student complaints, assign status updates, and communicate resolution progress.
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            minWidth: 160,
            transition: 'all 0.2s',
          }}
        >
          <option value="">📊 All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {(complaintsQuery.data || []).length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'rgba(108,99,255,0.05)',
          borderRadius: 14,
          border: '1px solid var(--border-default)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No complaints found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {(complaintsQuery.data || []).map((complaint) => (
            <div key={complaint.id} className="card-gradient" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Background glow effect */}
              <div
                style={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 120,
                  height: 120,
                  background: 'radial-gradient(circle, rgba(108,99,255,0.15), transparent)',
                  borderRadius: '50%',
                  filter: 'blur(40px)',
                  zIndex: 0,
                }}
              />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Sora', fontSize: 19, fontWeight: 700, letterSpacing: '-0.3px' }}>
                      {complaint.title}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                        🏠 {complaint.roomNumber ? `Room ${complaint.roomNumber}` : 'Room not available'}
                      </span>
                      <span style={{
                        fontSize: 12,
                        background: 'rgba(108,99,255,0.2)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 500,
                        color: '#6C63FF',
                      }}>
                        {complaint.category.replaceAll('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 12, marginBottom: 12, fontSize: 14 }}>
                  {complaint.description}
                </p>

                {complaint.imageUrl ? (
                  <div style={{ marginTop: 16, marginBottom: 12 }}>
                    <a
                      href={complaint.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--accent-secondary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                    >
                      📸 View uploaded photo
                    </a>
                    <div
                      style={{
                        marginTop: 10,
                        borderRadius: 12,
                        border: '1px solid var(--border-default)',
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <img
                        src={complaint.imageUrl}
                        alt="Complaint upload"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
                        onError={(event) => {
                          const target = event.currentTarget
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                {/* Admin control section */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(34,211,238,0.04))',
                  border: '1px solid rgba(34,211,238,0.2)',
                  borderRadius: 10,
                  padding: '16px',
                  marginTop: 16,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    ⚙️ Admin Controls
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '180px 1fr 140px',
                      gap: 12,
                    }}
                  >
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                        Status
                      </label>
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
                          fontSize: 13,
                          fontWeight: 500,
                          width: '100%',
                          cursor: 'pointer',
                        }}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                        Admin Note
                      </label>
                      <input
                        value={notes[complaint.id] ?? complaint.adminNote ?? ''}
                        onChange={(e) =>
                          setNotes((state) => ({
                            ...state,
                            [complaint.id]: e.target.value,
                          }))
                        }
                        placeholder="Share updates or next steps..."
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          width: '100%',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        className="btn-primary"
                        onClick={() =>
                          updateMutation.mutate({
                            id: complaint.id,
                            status: complaint.status,
                            adminNote: notes[complaint.id],
                          })
                        }
                        style={{ width: '100%' }}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? '💾' : '✓'} Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
