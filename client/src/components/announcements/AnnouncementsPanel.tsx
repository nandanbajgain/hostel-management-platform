import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
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
    <div className="card" style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 28 }}>📢</div>
        <h3 style={{ fontFamily: 'Sora', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
          Announcements
        </h3>
      </div>

      {canManage ? (
        <div
          style={{
            display: 'grid',
            gap: 12,
            padding: '18px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(34,211,238,0.06), rgba(34,211,238,0.03))',
            border: '1px solid rgba(34,211,238,0.15)',
          }}
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Announcement title"
            maxLength={100}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              padding: '12px 14px',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: 'DM Sans',
              transition: 'all 0.2s',
            }}
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            placeholder="Share an update for all residents..."
            maxLength={500}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              padding: '12px 14px',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: 'DM Sans',
              resize: 'vertical',
              transition: 'all 0.2s',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(event) => setIsUrgent(event.target.checked)}
                style={{ cursor: 'pointer', width: 16, height: 16 }}
              />
              🚨 Mark as urgent
            </label>
            <button
              className="btn-primary"
              onClick={() => createAnnouncement.mutate()}
              disabled={!title.trim() || !content.trim() || createAnnouncement.isPending}
              style={{ padding: '10px 20px', fontSize: 14 }}
            >
              {createAnnouncement.isPending ? '⏳ Posting...' : '✓ Post'}
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 12 }}>
        {(announcementsQuery.data || []).slice(0, 5).length > 0 ? (
          (announcementsQuery.data || []).slice(0, 5).map((announcement) => (
            <div
              key={announcement.id}
              style={{
                border: announcement.isUrgent ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border-default)',
                borderRadius: 12,
                padding: '16px',
                background: announcement.isUrgent
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))'
                  : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 700, 
                    fontSize: 15, 
                    fontFamily: 'Sora',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.2px',
                  }}>
                    {announcement.title}
                  </div>
                </div>
                {announcement.isUrgent ? (
                  <span style={{
                    color: '#F59E0B',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(245,158,11,0.15)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    🚨 Urgent
                  </span>
                ) : null}
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: 'DM Sans',
                }}
              >
                {announcement.content}
              </p>
            </div>
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '24px',
            color: 'var(--text-tertiary)',
            fontSize: 13,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 12,
            border: '1px dashed var(--border-default)',
          }}>
            📭 No announcements available right now.
          </div>
        )}
      </div>
    </div>
  )
}
