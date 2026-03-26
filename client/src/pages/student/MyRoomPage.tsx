import { useQuery } from '@tanstack/react-query'
import { BedDouble, Users } from 'lucide-react'
import api from '@/services/api'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import RoomListSkeleton from '@/components/shared/RoomListSkeleton'
import StatusBadge from '@/components/shared/StatusBadge'
import { useAuthStore } from '@/store/authStore'

type Room = {
  id: string
  number: string
  block: string
  floor: number
  status: string
  capacity: number
  amenities: string[]
  allocations: Array<{
    user: { id: string; name: string; email: string; phone?: string }
  }>
}

export default function MyRoomPage() {
  const { user } = useAuthStore()
  const roomQuery = useQuery({
    queryKey: ['my-room'],
    queryFn: () => api.get('/rooms/my').then((res) => res.data as Room | null),
  })

  const room = roomQuery.data || undefined

  if (roomQuery.isLoading) {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <LoadingSpinner />
        <RoomListSkeleton rows={2} />
      </div>
    )
  }

  if (!room) {
    return (
      <EmptyState
        icon={BedDouble}
        title="No room allocation found"
        description="We could not find an active room allocation for your account yet."
      />
    )
  }

  const roommates = room.allocations.filter((allocation) => allocation.user.id !== user?.id)

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0 }}>My Room</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Allocation details, amenities, and co-resident information.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: 16 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Room Number</div>
              <div style={{ fontFamily: 'Sora', fontSize: 34 }}>{room.number}</div>
            </div>
            <StatusBadge status={room.status} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
            {[
              ['Block', room.block],
              ['Floor', String(room.floor)],
              ['Capacity', `${room.allocations.length}/${room.capacity}`],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: '0.9rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 12,
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{label}</div>
                <div style={{ marginTop: 6, fontSize: 15, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
              Amenities
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {room.amenities.map((amenity) => (
                <span
                  key={amenity}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: 'rgba(34,211,238,0.1)',
                    color: 'var(--accent-secondary)',
                    fontSize: 12,
                  }}
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Users size={18} color="var(--accent-primary)" />
            <h3 style={{ fontFamily: 'Sora', fontSize: 16, margin: 0 }}>Roommates</h3>
          </div>
          {roommates.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              No roommate assigned at the moment.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {roommates.map(({ user: roommate }) => (
                <div
                  key={roommate.id}
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                    padding: '1rem',
                    background: 'var(--bg-tertiary)',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{roommate.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {roommate.email}
                  </div>
                  {roommate.phone ? (
                    <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {roommate.phone}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
