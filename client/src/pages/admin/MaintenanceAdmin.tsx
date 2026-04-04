import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Wrench } from 'lucide-react'
import toast from 'react-hot-toast'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusBadge from '@/components/shared/StatusBadge'
import CardListSkeleton from '@/components/shared/CardListSkeleton'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import type { MaintenanceStatus, MaintenanceTask } from '@/types'
import { getErrorMessage } from '@/lib/errors'

export default function MaintenanceAdmin() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'ADMIN' || user?.role === 'WARDEN'
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')

  const maintenanceQuery = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => api.get('/maintenance').then((res) => res.data as MaintenanceTask[]),
  })

  const createTask = useMutation({
    mutationFn: () => api.post('/maintenance', { title, description, location }),
    onSuccess: async () => {
      toast.success('Maintenance request submitted')
      setTitle('')
      setDescription('')
      setLocation('')
      await maintenanceQuery.refetch()
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Could not submit maintenance request'))
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: MaintenanceStatus
    }) => api.patch(`/maintenance/${id}/status`, { status }),
    onSuccess: async () => {
      toast.success('Maintenance status updated')
      await maintenanceQuery.refetch()
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Could not update status'))
    },
  })

  if (maintenanceQuery.isLoading) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <LoadingSpinner />
        <CardListSkeleton rows={4} height={150} />
      </div>
    )
  }

  const tasks = maintenanceQuery.data || []

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0 }}>Maintenance</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Submit maintenance requests and monitor facility work.
        </p>
      </div>

      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Wrench size={18} color="var(--accent-warning)" />
          <h3 style={{ fontFamily: 'Sora', fontSize: 16, margin: 0 }}>
            New maintenance request
          </h3>
        </div>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Issue title"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: '10px 12px',
            color: 'var(--text-primary)',
          }}
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the maintenance issue"
          rows={4}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: '10px 12px',
            color: 'var(--text-primary)',
            resize: 'vertical',
          }}
        />
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Location"
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
          onClick={() => createTask.mutate()}
          disabled={
            createTask.isPending || !title.trim() || !description.trim() || !location.trim()
          }
        >
          {createTask.isPending ? 'Submitting...' : 'Submit maintenance request'}
        </button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance tasks yet"
          description="Once maintenance work is logged, it will appear here for residents and staff."
        />
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {tasks.map((task) => (
            <div key={task.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'Sora', fontSize: 18 }}>{task.title}</div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>
                    {task.location} · Scheduled {format(new Date(task.scheduledAt), 'dd MMM yyyy')}
                  </div>
                </div>
                <StatusBadge status={task.status} />
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                {task.description}
              </p>

              {canManage ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                  {(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as MaintenanceStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus.mutate({ id: task.id, status })}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 999,
                          border: '1px solid var(--border-default)',
                          background:
                            task.status === status ? 'rgba(108,99,255,0.16)' : 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        {status.replaceAll('_', ' ')}
                      </button>
                    )
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
