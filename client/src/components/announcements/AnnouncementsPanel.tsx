import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Megaphone } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import type { Announcement } from '@/types'
import { getErrorMessage } from '@/lib/errors'

export default function AnnouncementsPanel() {
  const { user } = useAuthStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const canManage = user?.role === 'ADMIN' || user?.role === 'WARDEN'

  const announcementsQuery = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then((res) => res.data as Announcement[]),
  })

  const createAnnouncement = useMutation({
    mutationFn: () => api.post('/announcements', { title, content, isUrgent }),
    onSuccess: async () => {
      toast.success('Announcement posted')
      setTitle('')
      setContent('')
      setIsUrgent(false)
      await announcementsQuery.refetch()
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Could not post announcement'))
    },
  })

  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Megaphone size={18} color="var(--accent-secondary)" />
        <h3 style={{ fontFamily: 'Sora', fontSize: 16, margin: 0 }}>Announcements</h3>
      </div>

      {canManage ? (
        <div
          style={{
            display: 'grid',
            gap: 10,
            padding: '1rem',
            borderRadius: 12,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Announcement title"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: '10px 12px',
              color: 'var(--text-primary)',
            }}
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            placeholder="Share an update for residents"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: '10px 12px',
              color: 'var(--text-primary)',
              resize: 'vertical',
            }}
          />
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(event) => setIsUrgent(event.target.checked)}
            />
            Mark as urgent
          </label>
          <button
            className="btn-primary"
            onClick={() => createAnnouncement.mutate()}
            disabled={!title.trim() || !content.trim() || createAnnouncement.isPending}
          >
            {createAnnouncement.isPending ? 'Posting...' : 'Post announcement'}
          </button>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 12 }}>
        {(announcementsQuery.data || []).slice(0, 5).map((announcement) => (
          <div
            key={announcement.id}
            style={{
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              padding: '1rem',
              background: announcement.isUrgent
                ? 'rgba(245,158,11,0.08)'
                : 'var(--bg-tertiary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontWeight: 600 }}>{announcement.title}</div>
              {announcement.isUrgent ? (
                <span style={{ color: 'var(--accent-warning)', fontSize: 12 }}>
                  Urgent
                </span>
              ) : null}
            </div>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 14,
                lineHeight: 1.6,
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              {announcement.content}
            </p>
          </div>
        ))}
        {!announcementsQuery.isLoading && (announcementsQuery.data || []).length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            No announcements available right now.
          </p>
        ) : null}
      </div>
    </div>
  )
}
