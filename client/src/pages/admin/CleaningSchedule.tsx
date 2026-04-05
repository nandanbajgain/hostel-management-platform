import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, RefreshCw } from 'lucide-react'
import api from '@/services/api'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'

type Staff = {
  id: string
  name: string
  phone?: string | null
  zone?: string | null
  isActive: boolean
  createdAt: string
}

type Room = {
  id: string
  number: string
  block: string
  floor: number
}

type Assignment = {
  id: string
  scheduledStart: string
  scheduledEnd: string
  status: string
  notes?: string | null
  room: Room
  staff: { id: string; name: string; phone?: string | null; zone?: string | null }
  feedback: null | { cleaned: boolean; rating: number; comment?: string | null; submittedAt: string }
}

export default function CleaningSchedule() {
  const [staffName, setStaffName] = useState('')
  const [staffPhone, setStaffPhone] = useState('')
  const [staffZone, setStaffZone] = useState('')

  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('12:00')
  const [notes, setNotes] = useState('')

  const staffQuery = useQuery({
    queryKey: ['cleaning-staff'],
    queryFn: () => api.get('/cleaning/staff').then((r) => r.data as Staff[]),
  })

  const roomsQuery = useQuery({
    queryKey: ['rooms-cleaning'],
    queryFn: () => api.get('/rooms').then((r) => r.data as any[]),
  })

  const assignmentsQuery = useQuery({
    queryKey: ['cleaning-assignments', date],
    queryFn: () =>
      api
        .get('/cleaning/assignments', {
          params: {
            from: new Date(date + 'T00:00:00.000Z').toISOString(),
            to: new Date(date + 'T23:59:59.999Z').toISOString(),
          },
        })
        .then((r) => r.data as Assignment[]),
  })

  const complianceQuery = useQuery({
    queryKey: ['cleaning-compliance'],
    queryFn: () => api.get('/cleaning/admin/compliance?days=7').then((r) => r.data as any),
  })

  const rooms = useMemo(() => {
    const data = roomsQuery.data || []
    return data.map((room) => ({
      id: room.id,
      number: room.number,
      block: room.block,
      floor: room.floor,
    })) as Room[]
  }, [roomsQuery.data])

  const createStaffMutation = useMutation({
    mutationFn: () =>
      api.post('/cleaning/staff', {
        name: staffName,
        phone: staffPhone || undefined,
        zone: staffZone || undefined,
      }),
    onSuccess: () => {
      toast.success('Staff added')
      setStaffName('')
      setStaffPhone('')
      setStaffZone('')
      staffQuery.refetch()
    },
    onError: () => toast.error('Failed to add staff'),
  })

  const createAssignmentMutation = useMutation({
    mutationFn: () => {
      const start = new Date(`${date}T${startTime}:00`)
      const end = new Date(`${date}T${endTime}:00`)
      return api.post('/cleaning/assignments', {
        staffId: selectedStaffId,
        roomIds: [selectedRoomId],
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        notes: notes || undefined,
      })
    },
    onSuccess: () => {
      toast.success('Cleaning scheduled')
      setNotes('')
      assignmentsQuery.refetch()
      complianceQuery.refetch()
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'Failed to schedule')
    },
  })

  if (staffQuery.isLoading || roomsQuery.isLoading) {
    return <LoadingSpinner />
  }

  const staff = staffQuery.data || []

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div>
        <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0 }}>Cleaning Schedule</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Assign housekeeping staff to rooms with a time window. Students will see the schedule and can rate cleaning.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontFamily: 'Sora', fontSize: 16, marginTop: 0 }}>Add Staff</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            <input
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Staff name"
              style={inputStyle}
            />
            <input
              value={staffPhone}
              onChange={(e) => setStaffPhone(e.target.value)}
              placeholder="Phone (optional)"
              style={inputStyle}
            />
            <input
              value={staffZone}
              onChange={(e) => setStaffZone(e.target.value)}
              placeholder="Zone / Tower (optional)"
              style={inputStyle}
            />
            <button
              onClick={() => createStaffMutation.mutate()}
              disabled={!staffName.trim() || createStaffMutation.isPending}
              style={primaryButtonStyle}
            >
              <Plus size={16} /> Add staff
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'Sora', fontSize: 16, marginTop: 0 }}>Schedule Cleaning</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select staff</option>
              {staff
                .filter((s) => s.isActive)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.zone ? ` (${s.zone})` : ''}
                  </option>
                ))}
            </select>

            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number} â€” Block {r.block}, Floor {r.floor}
                </option>
              ))}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
            </div>

            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              style={inputStyle}
            />

            <button
              onClick={() => createAssignmentMutation.mutate()}
              disabled={!selectedStaffId || !selectedRoomId || createAssignmentMutation.isPending}
              style={primaryButtonStyle}
            >
              <Plus size={16} /> Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Sora', fontSize: 16 }}>Weekly compliance</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Rooms missing a cleaning entry in last 7 days: <b>{complianceQuery.data?.roomsMissingCleaning ?? '-'}</b>
          </div>
        </div>
        <button
          onClick={() => {
            complianceQuery.refetch()
            assignmentsQuery.refetch()
            staffQuery.refetch()
          }}
          style={secondaryButtonStyle}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'Sora', fontSize: 16, marginTop: 0 }}>Schedule for {date}</h3>
        </div>

        {assignmentsQuery.isLoading ? (
          <LoadingSpinner />
        ) : assignmentsQuery.data && assignmentsQuery.data.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <th style={thStyle}>Room</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Staff</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {assignmentsQuery.data.map((a) => (
                  <tr key={a.id} style={{ borderTop: '1px solid var(--border-default)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{a.room.number}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Block {a.room.block} â· Floor {a.room.floor}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {new Date(a.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} â€“{' '}
                      {new Date(a.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{a.staff.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {a.staff.phone || 'No phone'} {a.staff.zone ? `â· ${a.staff.zone}` : ''}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          background:
                            a.status === 'COMPLETED'
                              ? 'rgba(16,185,129,0.18)'
                              : a.status === 'MISSED'
                                ? 'rgba(239,68,68,0.18)'
                                : 'rgba(255,255,255,0.06)',
                          color:
                            a.status === 'COMPLETED'
                              ? 'var(--accent-success)'
                              : a.status === 'MISSED'
                                ? 'var(--accent-danger)'
                                : 'var(--text-secondary)',
                        }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {a.feedback ? (
                        <div style={{ fontSize: 12 }}>
                          {a.feedback.cleaned ? 'Cleaned' : 'Not cleaned'} â· Rating {a.feedback.rating}/5
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Pending</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No schedule"
            description="No cleaning entries found for this date. Create one above."
            icon={RefreshCw}
          />
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-default)',
  borderRadius: 10,
  padding: '10px 12px',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 12px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--accent-primary)',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 600,
}

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '9px 12px',
  borderRadius: 10,
  border: '1px solid var(--border-default)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontWeight: 600,
}

const thStyle: React.CSSProperties = {
  padding: '10px 10px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 10px',
  verticalAlign: 'top',
}

