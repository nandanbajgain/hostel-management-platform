import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BedDouble, Search } from 'lucide-react'
import api from '@/services/api'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusBadge from '@/components/shared/StatusBadge'

type Room = {
  id: string
  number: string
  floor: number
  block: string
  capacity: number
  status: string
  amenities: string[]
  allocations: Array<{ user: { id: string; name: string; email: string } }>
}

export default function RoomManagement() {
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const roomsQuery = useQuery({
    queryKey: ['room-management', filter],
    queryFn: () =>
      api.get('/rooms', { params: filter ? { status: filter } : undefined }).then((res) => res.data as Room[]),
  })

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return roomsQuery.data || []
    const q = search.toLowerCase()
    return (roomsQuery.data || []).filter(
      (room) =>
        room.number.toLowerCase().includes(q) ||
        room.block.toLowerCase().includes(q) ||
        room.allocations.some((a) => a.user.name.toLowerCase().includes(q))
    )
  }, [search, roomsQuery.data])

  if (roomsQuery.isLoading) return <LoadingSpinner />

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0, letterSpacing: '-0.5px' }}>🏠 Room Management</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Inspect occupancy, amenities, and resident assignments.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room, block, or occupant..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 10,
              padding: '12px 14px 12px 40px',
              fontSize: 14,
            }}
          />
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
          }}
        >
          <option value="">📊 All statuses</option>
          <option value="AVAILABLE">✅ Available</option>
          <option value="OCCUPIED">👥 Occupied</option>
          <option value="MAINTENANCE">🔧 Maintenance</option>
          <option value="RESERVED">🔒 Reserved</option>
        </select>
      </div>

      {filteredRooms.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'rgba(108,99,255,0.05)',
          borderRadius: 14,
          border: '1px dashed var(--border-default)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{search ? 'No rooms match your search' : 'No rooms found'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filteredRooms.map((room) => (
          <div key={room.id} className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(108,99,255,0.12)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <BedDouble size={20} color="var(--accent-primary)" />
                </div>
                <div>
                  <div style={{ fontFamily: 'Sora', fontSize: 18 }}>{room.number}</div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                    Block {room.block} · Floor {room.floor} · Capacity {room.capacity}
                  </div>
                </div>
              </div>
              <StatusBadge status={room.status} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {room.amenities.map((amenity) => (
                <span
                  key={amenity}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: 'var(--bg-tertiary)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {amenity}
                </span>
              ))}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              👥 Occupants:{' '}
              {room.allocations.length
                ? room.allocations.map((item) => item.user.name).join(', ')
                : '—'}
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  )
}
