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
import { useAuthStore } from '@/store/authStore'

type RoomApiItem = {
  id: string
  number: string
  block: string
  floor: number
  amenities: string[]
  allocations: Array<{ user: { id: string; name: string; email: string } }>
}

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const complaintsQuery = useQuery({
    queryKey: ['student-complaints'],
    queryFn: () => api.get('/complaints/mine').then((res) => res.data as Complaint[]),
  })
  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms').then((res) => res.data as RoomApiItem[]),
  })

  const myRoom = useMemo(
    () =>
      roomsQuery.data?.find((room) =>
        room.allocations.some((allocation) => allocation.user.id === user?.id)
      ),
    [roomsQuery.data, user?.id]
  )

  if (complaintsQuery.isLoading || roomsQuery.isLoading) {
    return (
      <div style={{ display: 'grid', gap: 24 }}>
        <StatsGridSkeleton />
        <LoadingSpinner />
      </div>
    )
  }

  const complaints = complaintsQuery.data || []

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
