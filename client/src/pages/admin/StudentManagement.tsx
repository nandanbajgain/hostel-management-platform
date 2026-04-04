import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GraduationCap, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusBadge from '@/components/shared/StatusBadge'
import { getErrorMessage } from '@/lib/errors'

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
  approvalStatus: string
  allocation?: { room?: { number: string; block: string } } | null
}

type Suggestion = {
  id: string
  name: string
  course?: string
  sportsInterests: string[]
  careerGoal?: string
  score: number
  reasons: string[]
  allocation?: { room?: { number: string } } | null
}

export default function StudentManagement() {
  const queryClient = useQueryClient()
  const [sortBy, setSortBy] = useState<'course' | 'sports' | 'career' | 'approval'>('course')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const studentsQuery = useQuery({
    queryKey: ['students', sortBy],
    queryFn: () =>
      api.get('/users/students', { params: { sortBy } }).then((res) => res.data as Student[]),
  })

  const students = studentsQuery.data || []
  const activeStudentId = selectedId || students[0]?.id || null
  const selectedStudent =
    students.find((student) => student.id === activeStudentId) || students[0]

  const suggestionsQuery = useQuery({
    queryKey: ['roommate-suggestions', activeStudentId],
    queryFn: () =>
      api
        .get(`/users/students/${activeStudentId}/roommate-suggestions`)
        .then((res) => res.data as Suggestion[]),
    enabled: !!activeStudentId,
  })

  const approvalMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api.patch(`/users/students/${id}/approval`, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['students'] })
      const key = ['students', sortBy] as const
      const previous = queryClient.getQueryData<Student[]>(key) || []

      queryClient.setQueryData<Student[]>(key, (current = []) =>
        current.map((student) =>
          student.id === id ? { ...student, approvalStatus: status } : student
        )
      )

      return { previous, key }
    },
    onSuccess: async () => {
      toast.success('Student status updated')
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      await queryClient.invalidateQueries({ queryKey: ['roommate-suggestions'] })
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous)
      }
      toast.error(getErrorMessage(error, 'Could not update student'))
    },
  })

  if (studentsQuery.isLoading) return <LoadingSpinner />

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0 }}>Student Profiles</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Review pending registrations and sort students by common profile traits.
          </p>
        </div>
        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as 'course' | 'sports' | 'career' | 'approval')
          }
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
        <div className="card">
          <div style={{ display: 'grid', gap: 14 }}>
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedId(student.id)}
                style={{
                  textAlign: 'left',
                  padding: '1rem',
                  borderRadius: 14,
                  border:
                    selectedStudent?.id === student.id
                      ? '1px solid var(--accent-primary)'
                      : '1px solid var(--border-default)',
                  background:
                    selectedStudent?.id === student.id
                      ? 'rgba(108,99,255,0.08)'
                      : 'var(--bg-tertiary)',
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
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{student.name}</div>
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
                    ? `${student.allocation.room.number} (${student.allocation.room.block})`
                    : 'Not allocated'}
                </div>
              </button>
            ))}
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
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Email:</strong>{' '}
                  {selectedStudent.email}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Phone:</strong>{' '}
                  {selectedStudent.phone}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Gender:</strong>{' '}
                  {selectedStudent.gender}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Course:</strong>{' '}
                  {selectedStudent.course}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Career goal:</strong>{' '}
                  {selectedStudent.careerGoal}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Sports:</strong>{' '}
                  {(selectedStudent.sportsInterests || []).join(', ')}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Parent contact:</strong>{' '}
                  {selectedStudent.parentContactNo}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Address:</strong>{' '}
                  {selectedStudent.address}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  className="btn-primary"
                  onClick={() =>
                    approvalMutation.mutate({ id: selectedStudent.id, status: 'APPROVED' })
                  }
                  disabled={
                    approvalMutation.isPending ||
                    selectedStudent.approvalStatus === 'APPROVED'
                  }
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    approvalMutation.mutate({ id: selectedStudent.id, status: 'REJECTED' })
                  }
                  disabled={approvalMutation.isPending}
                  style={{
                    border: '1px solid rgba(239,68,68,0.35)',
                    background: 'rgba(239,68,68,0.08)',
                    color: 'var(--accent-danger)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ) : null}

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Users size={18} color="var(--accent-secondary)" />
              <h3 style={{ margin: 0, fontFamily: 'Sora', fontSize: 17 }}>
                Roommate suggestions
              </h3>
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
                        <div style={{ fontWeight: 600 }}>{candidate.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {candidate.course}
                        </div>
                      </div>
                      <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
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
    </div>
  )
}
