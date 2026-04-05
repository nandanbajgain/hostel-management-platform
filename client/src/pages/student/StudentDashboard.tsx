import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, BedDouble, Clock3, Wifi } from 'lucide-react'
import api from '@/services/api'
import AnnouncementsPanel from '@/components/announcements/AnnouncementsPanel'
import StatsGrid from '@/components/dashboard/StatsGrid'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import StatsGridSkeleton from '@/components/shared/StatsGridSkeleton'
import type { Complaint } from '@/types'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

type RoomApiItem = {
  id: string
  number: string
  block: string
  floor: number
  amenities: string[]
  allocations: Array<{ user: { id: string; name: string; email: string } }>
}

export default function StudentDashboard() {
  const complaintsQuery = useQuery({
    queryKey: ['student-complaints'],
    queryFn: () => api.get('/complaints/mine').then((res) => res.data as Complaint[]),
  })

  const myRoomQuery = useQuery({
    queryKey: ['my-room-dashboard'],
    queryFn: () => api.get('/rooms/my').then((res) => res.data as RoomApiItem | null),
  })

  const cleaningQuery = useQuery({
    queryKey: ['cleaning-upcoming'],
    queryFn: () => api.get('/cleaning/my/upcoming').then((res) => res.data as any),
  })

  const myRoom = useMemo(() => myRoomQuery.data || undefined, [myRoomQuery.data])
  const cleaning = cleaningQuery.data

  if (complaintsQuery.isLoading || myRoomQuery.isLoading) {
    return (
      <div style={{ display: 'grid', gap: 24 }}>
        <StatsGridSkeleton />
        <LoadingSpinner />
      </div>
    )
  }

  const complaints = complaintsQuery.data || []

  const feedbackMutation = useMutation({
    mutationFn: (payload: { assignmentId: string; cleaned: boolean; rating: number; comment?: string }) =>
      api.post('/cleaning/feedback', payload),
    onSuccess: () => {
      toast.success('Thanks for the feedback')
      cleaningQuery.refetch()
      complaintsQuery.refetch()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit feedback'),
  })

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0 }}>Student Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Track your room, facilities, and complaint activity in one place.
        </p>
      </div>

      <StatsGrid
        items={[
          {
            icon: BedDouble,
            label: 'Allocated Room',
            value: myRoom ? myRoom.number : 'None',
            sub: myRoom ? `Block ${myRoom.block}, Floor ${myRoom.floor}` : 'Allocation pending',
            color: '#6C63FF',
          },
          {
            icon: AlertCircle,
            label: 'My Complaints',
            value: complaints.length,
            sub: `${complaints.filter((item) => item.status !== 'RESOLVED').length} active`,
            color: '#22D3EE',
          },
          {
            icon: Clock3,
            label: 'Resolved',
            value: complaints.filter((item) => item.status === 'RESOLVED').length,
            sub: 'Closed successfully',
            color: '#10B981',
          },
          {
            icon: Wifi,
            label: 'Facilities',
            value: myRoom?.amenities.length ?? 0,
            sub: myRoom?.amenities.join(', ') || 'Room amenities unavailable',
            color: '#F59E0B',
          },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 16 }}>
        {cleaning?.feedbackDue ? (
          <div className="card">
            <h3 style={{ fontFamily: 'Sora', fontSize: 16, marginBottom: 10 }}>Cleaning feedback</h3>
            <p style={{ marginTop: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
              Was your room cleaned for the scheduled window?
            </p>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>
              Staff: {cleaning.feedbackDue.staffName}
              {cleaning.feedbackDue.staffPhone ? ` (${cleaning.feedbackDue.staffPhone})` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() =>
                    feedbackMutation.mutate({
                      assignmentId: cleaning.feedbackDue.assignmentId,
                      cleaned: true,
                      rating,
                    })
                  }
                  disabled={feedbackMutation.isPending}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {rating}/5
                </button>
              ))}
              <button
                onClick={() =>
                  feedbackMutation.mutate({
                    assignmentId: cleaning.feedbackDue.assignmentId,
                    cleaned: false,
                    rating: 1,
                    comment: 'Room was not cleaned in the scheduled window.',
                  })
                }
                disabled={feedbackMutation.isPending}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'rgba(239,68,68,0.18)',
                  color: 'var(--accent-danger)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Not cleaned
              </button>
            </div>
          </div>
        ) : cleaning?.upcoming ? (
          <div className="card">
            <h3 style={{ fontFamily: 'Sora', fontSize: 16, marginBottom: 10 }}>Next room cleaning</h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {new Date(cleaning.upcoming.scheduledStart).toLocaleString([], {
                weekday: 'short',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              â€“{' '}
              {new Date(cleaning.upcoming.scheduledEnd).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-tertiary)' }}>
              Staff: <b>{cleaning.upcoming.staff.name}</b>
              {cleaning.upcoming.staff.phone ? ` (${cleaning.upcoming.staff.phone})` : ''}{' '}
              {cleaning.upcoming.staff.zone ? `â· ${cleaning.upcoming.staff.zone}` : ''}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
              Please keep the room accessible during the scheduled window.
            </div>
          </div>
        ) : null}

        {myRoom ? (
          <div className="card">
            <h3 style={{ fontFamily: 'Sora', fontSize: 16, marginBottom: 14 }}>Current Room</h3>
            <div
              style={{
                borderRadius: 14,
                padding: '1.25rem',
                background:
                  'linear-gradient(135deg, rgba(108,99,255,0.16), rgba(34,211,238,0.08))',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ fontFamily: 'Sora', fontSize: 32, marginBottom: 4 }}>
                {myRoom.number}
              </div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 18 }}>
                Block {myRoom.block} · Floor {myRoom.floor}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {myRoom.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.05)',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={BedDouble}
            title="Room not allocated"
            description="Your room allocation is not visible yet. Contact the warden office if this should already be assigned."
          />
        )}

        <ActivityFeed
          title="Recent Complaints"
          items={complaints.slice(0, 5).map((item) => ({
            id: item.id,
            title: item.title,
            subtitle: item.category,
            status: item.status,
            timestamp: item.createdAt,
          }))}
        />
      </div>

      <AnnouncementsPanel />
    </div>
  )
}
