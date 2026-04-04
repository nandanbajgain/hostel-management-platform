import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BedDouble, GraduationCap, Search, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusBadge from '@/components/shared/StatusBadge'
import { getErrorMessage } from '@/lib/errors'
import CardListSkeleton from '@/components/shared/CardListSkeleton'
import type { ApprovalStatus } from '@/types'

type Student = {
  id: string
  name: string
  email: string
  phone?: string
  avatarUrl?: string
  enrollmentNo?: string
  course?: string
  gender?: string
  sportsInterests?: string[]
  careerGoal?: string
  address?: string
  parentContactNo?: string
  approvalStatus: ApprovalStatus
  approvedAt?: string | null
  approvedBy?: string | null
  allocation?: {
    isActive: boolean
    room?: { id: string; number: string; block: string; floor: number }
  } | null
}

type Suggestion = {
  id: string
  name: string
  course?: string
  sportsInterests: string[]
  careerGoal?: string
  score: number
  reasons: string[]
  allocation?: {
    isActive: boolean
    room?: { id: string; number: string; block: string; floor: number; capacity: number }
  } | null
}

type RoomApiItem = {
  id: string
  number: string
  block: string
  floor: number
  capacity: number
  status: string
  amenities: string[]
  allocations: Array<{ user: { id: string; name: string; email: string } }>
}

export default function StudentManagement() {
  const queryClient = useQueryClient()

  const [view, setView] = useState<'pending' | 'students'>('pending')
  const [sortBy, setSortBy] = useState<'course' | 'sports' | 'career' | 'approval'>('course')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [studentSearch, setStudentSearch] = useState('')

  const [allotOpen, setAllotOpen] = useState(false)
  const [roomSearch, setRoomSearch] = useState('')
  const [allotForId, setAllotForId] = useState<string | null>(null)

  const pendingQuery = useQuery({
    queryKey: ['students', 'pending', sortBy],
    queryFn: () =>
      api
        .get('/users/students', { params: { sortBy, approvalStatus: 'PENDING' } })
        .then((res) => res.data as Student[]),
  })

  const approvedQuery = useQuery({
    queryKey: ['students', 'approved', sortBy],
    queryFn: () =>
      api
        .get('/users/students', { params: { sortBy, approvalStatus: 'APPROVED' } })
        .then((res) => res.data as Student[]),
  })

  const activeList = useMemo(
    () => (view === 'pending' ? pendingQuery.data || [] : approvedQuery.data || []),
    [approvedQuery.data, pendingQuery.data, view]
  )

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return activeList
    return activeList.filter((s) => {
      const hay = `${s.name} ${s.email} ${s.enrollmentNo ?? ''} ${s.course ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [activeList, studentSearch])

  const activeStudentId = selectedId || filteredStudents[0]?.id || null
  const selectedStudent =
    filteredStudents.find((student) => student.id === activeStudentId) || filteredStudents[0]

  const suggestionsQuery = useQuery({
    queryKey: ['roommate-suggestions', activeStudentId],
    queryFn: () =>
      api
        .get(`/users/students/${activeStudentId}/roommate-suggestions`)
        .then((res) => res.data as Suggestion[]),
    enabled: !!activeStudentId,
  })

  const roomsQuery = useQuery({
    queryKey: ['rooms', 'available'],
    queryFn: () =>
      api.get('/rooms', { params: { status: 'AVAILABLE' } }).then((res) => res.data as RoomApiItem[]),
    enabled: allotOpen,
  })

  const approvalMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api.patch(`/users/students/${id}/approval`, { status }),
    onMutate: async ({ id, status }) => {
      const pendingKey = ['students', 'pending', sortBy] as const
      const approvedKey = ['students', 'approved', sortBy] as const
      await Promise.all([
        queryClient.cancelQueries({ queryKey: pendingKey }),
        queryClient.cancelQueries({ queryKey: approvedKey }),
      ])

      const prevPending = queryClient.getQueryData<Student[]>(pendingKey) || []
      const prevApproved = queryClient.getQueryData<Student[]>(approvedKey) || []
      const student = prevPending.find((s) => s.id === id)

      if (status === 'APPROVED' && student) {
        queryClient.setQueryData<Student[]>(pendingKey, (current = []) => current.filter((s) => s.id !== id))
        queryClient.setQueryData<Student[]>(approvedKey, (current = []) => [
          { ...student, approvalStatus: 'APPROVED' },
          ...current,
        ])
      } else {
        queryClient.setQueryData<Student[]>(pendingKey, (current = []) => current.filter((s) => s.id !== id))
      }

      return { pendingKey, approvedKey, prevPending, prevApproved }
    },
    onSuccess: async (_res, variables) => {
      toast.success('Student status updated')
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      await queryClient.invalidateQueries({ queryKey: ['roommate-suggestions'] })

      if (variables.status === 'APPROVED') {
        setView('students')
        setSelectedId(variables.id)
        setAllotForId(variables.id)
        setAllotOpen(true)
      }
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.prevPending) queryClient.setQueryData(context.pendingKey, context.prevPending)
      if (context?.prevApproved) queryClient.setQueryData(context.approvedKey, context.prevApproved)
      toast.error(getErrorMessage(error, 'Could not update student'))
    },
  })

  const allocateMutation = useMutation({
    mutationFn: ({ userId, roomId }: { userId: string; roomId: string }) =>
      api.post('/rooms/allocate', { userId, roomId }),
    onSuccess: async () => {
      toast.success('Room allocated')
      setAllotOpen(false)
      setAllotForId(null)
      setRoomSearch('')
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      await queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Could not allocate room'))
    },
  })

  const isLoading = pendingQuery.isLoading || approvedQuery.isLoading
  if (isLoading) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <LoadingSpinner />
        <CardListSkeleton rows={4} height={140} />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0 }}>Student Profiles</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Approve registrations, then allot rooms with a clean audit trail.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="card-glass" style={{ display: 'inline-flex', gap: 8, padding: 6, borderRadius: 999 }}>
            <button
              onClick={() => {
                setView('pending')
                setSelectedId(null)
              }}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '8px 12px',
                cursor: 'pointer',
                background: view === 'pending' ? 'rgba(108,99,255,0.18)' : 'transparent',
                color: view === 'pending' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Pending ({(pendingQuery.data || []).length})
            </button>
            <button
              onClick={() => {
                setView('students')
                setSelectedId(null)
              }}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '8px 12px',
                cursor: 'pointer',
                background: view === 'students' ? 'rgba(34,211,238,0.16)' : 'transparent',
                color: view === 'students' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Students ({(approvedQuery.data || []).length})
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            <option value="course">Sort by course</option>
            <option value="sports">Sort by sports</option>
            <option value="career">Sort by career goal</option>
            <option value="approval">Sort by approval</option>
          </select>
        </div>
      </div>

      <div className="card-glass" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Search size={16} color="var(--text-tertiary)" />
        <input
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          placeholder={view === 'pending' ? 'Search pending registrations…' : 'Search approved students…'}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
        <div className="card">
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedId(student.id)}
                style={{
                  textAlign: 'left',
                  padding: '1rem',
                  borderRadius: 14,
                  border: selectedStudent?.id === student.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                  background: selectedStudent?.id === student.id ? 'rgba(108,99,255,0.08)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <img
                      src={student.avatarUrl || 'https://placehold.co/80x80/png'}
                      alt={student.name}
                      style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{student.name}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 }}>
                        {student.enrollmentNo} · {student.course}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 6 }}>
                        {(student.sportsInterests || []).join(', ')} · {student.careerGoal}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={student.approvalStatus} />
                </div>
                <div style={{ marginTop: 10, color: 'var(--text-tertiary)', fontSize: 12 }}>
                  Room:{' '}
                  {student.allocation?.room
                    ? `${student.allocation.room.number} (Block ${student.allocation.room.block})`
                    : 'Not allocated'}
                </div>
              </button>
            ))}

            {!pendingQuery.isFetching && !approvedQuery.isFetching && filteredStudents.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                No students found.
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {selectedStudent ? (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <GraduationCap size={18} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontFamily: 'Sora', fontSize: 17 }}>Student details</h3>
              </div>

              <div style={{ display: 'grid', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {selectedStudent.email}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Phone:</strong> {selectedStudent.phone}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Gender:</strong> {selectedStudent.gender}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Course:</strong> {selectedStudent.course}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Career goal:</strong> {selectedStudent.careerGoal}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Sports:</strong> {(selectedStudent.sportsInterests || []).join(', ')}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Parent contact:</strong> {selectedStudent.parentContactNo}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Address:</strong> {selectedStudent.address}</div>
              </div>

              {view === 'pending' && selectedStudent.approvalStatus === 'PENDING' ? (
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    onClick={() => approvalMutation.mutate({ id: selectedStudent.id, status: 'APPROVED' })}
                    disabled={approvalMutation.isPending}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <BedDouble size={16} />
                    Approve & allot room
                  </button>
                  <button
                    onClick={() => approvalMutation.mutate({ id: selectedStudent.id, status: 'REJECTED' })}
                    disabled={approvalMutation.isPending}
                    style={{
                      border: '1px solid rgba(239,68,68,0.35)',
                      background: 'rgba(239,68,68,0.08)',
                      color: 'var(--accent-danger)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontWeight: 800,
                    }}
                  >
                    Reject
                  </button>
                </div>
              ) : null}

              {view === 'students' && selectedStudent.approvalStatus === 'APPROVED' ? (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: 12,
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-tertiary)',
                      display: 'grid',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>Room allocation</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 3 }}>
                          {selectedStudent.allocation?.room
                            ? `Allocated to ${selectedStudent.allocation.room.number} (Block ${selectedStudent.allocation.room.block}, Floor ${selectedStudent.allocation.room.floor})`
                            : 'Not allocated yet'}
                        </div>
                      </div>
                      {!selectedStudent.allocation?.room ? (
                        <button
                          className="btn-primary"
                          onClick={() => {
                            setAllotForId(selectedStudent.id)
                            setAllotOpen(true)
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                        >
                          <BedDouble size={16} />
                          Allot room
                        </button>
                      ) : null}
                    </div>

                    {!selectedStudent.allocation?.room && (suggestionsQuery.data || []).some((s) => s.allocation?.room?.id) ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {(suggestionsQuery.data || [])
                          .filter((s) => s.allocation?.room?.id)
                          .slice(0, 3)
                          .map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                const roomId = s.allocation?.room?.id
                                if (!roomId) return
                                allocateMutation.mutate({ userId: selectedStudent.id, roomId })
                              }}
                              disabled={allocateMutation.isPending}
                              style={{
                                border: '1px solid rgba(34,211,238,0.22)',
                                background: 'rgba(34,211,238,0.10)',
                                color: 'var(--text-primary)',
                                borderRadius: 999,
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              Allot with {s.name.split(' ')[0]} ({s.allocation?.room?.number})
                            </button>
                          ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Users size={18} color="var(--accent-secondary)" />
              <h3 style={{ margin: 0, fontFamily: 'Sora', fontSize: 17 }}>Roommate suggestions</h3>
            </div>

            {suggestionsQuery.isLoading ? (
              <LoadingSpinner />
            ) : (suggestionsQuery.data || []).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                No compatible approved roommates found yet for the selected student.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {(suggestionsQuery.data || []).map((candidate) => (
                  <div
                    key={candidate.id}
                    style={{
                      border: '1px solid var(--border-default)',
                      borderRadius: 12,
                      padding: '0.9rem',
                      background: 'var(--bg-tertiary)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{candidate.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {candidate.course}
                        </div>
                      </div>
                      <span style={{ color: 'var(--accent-secondary)', fontWeight: 900 }}>
                        Score {candidate.score}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                      {candidate.reasons.join(' · ')}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      Current room: {candidate.allocation?.room?.number || 'Not allocated'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {allotOpen ? (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setAllotOpen(false)
              setAllotForId(null)
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 280,
            background: 'rgba(0,0,0,0.55)',
            display: 'grid',
            placeItems: 'start center',
            paddingTop: 90,
          }}
        >
          <div
            className="card-glass"
            style={{
              width: 'min(980px, calc(100vw - 24px))',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 30px 90px rgba(0,0,0,0.55)',
            }}
          >
            <div
              style={{
                padding: 14,
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <BedDouble size={18} color="var(--accent-secondary)" />
              <div style={{ fontWeight: 900 }}>Allot a room</div>
              <button
                onClick={() => {
                  setAllotOpen(false)
                  setAllotForId(null)
                }}
                style={{
                  marginLeft: 'auto',
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid var(--border-default)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 14, borderBottom: '1px solid var(--border-default)', display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={16} color="var(--text-tertiary)" />
                <input
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  placeholder="Search by room number, block, floor…"
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ padding: 14, maxHeight: 520, overflowY: 'auto' }}>
              {roomsQuery.isLoading ? (
                <CardListSkeleton rows={6} height={92} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 12 }}>
                  {(roomsQuery.data || [])
                    .filter((room) => {
                      const q = roomSearch.trim().toLowerCase()
                      if (!q) return true
                      const hay = `${room.number} ${room.block} ${room.floor}`.toLowerCase()
                      return hay.includes(q)
                    })
                    .map((room) => {
                      const occupancy = room.allocations.length
                      const slotsLeft = Math.max(0, room.capacity - occupancy)
                      return (
                        <div
                          key={room.id}
                          style={{
                            border: '1px solid var(--border-default)',
                            borderRadius: 14,
                            padding: '12px 12px',
                            background: 'var(--bg-tertiary)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 900, fontSize: 16 }}>
                              {room.number}{' '}
                              <span style={{ color: 'var(--text-tertiary)', fontWeight: 800, fontSize: 12 }}>
                                Block {room.block} · Floor {room.floor}
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 6 }}>
                              Occupancy {occupancy}/{room.capacity} · {slotsLeft} slot{slotsLeft === 1 ? '' : 's'} left
                            </div>
                          </div>
                          <button
                            className="btn-primary"
                            onClick={() => {
                              const userId = allotForId || selectedStudent?.id
                              if (!userId) return
                              allocateMutation.mutate({ userId, roomId: room.id })
                            }}
                            disabled={allocateMutation.isPending || slotsLeft <= 0}
                          >
                            Allocate
                          </button>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
