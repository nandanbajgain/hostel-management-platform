import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, Link2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusTracker from '@/components/complaints/StatusTracker'
import { copyToClipboard } from '@/lib/clipboard'
import type { ComplaintCategory, ComplaintStatus } from '@/types'
import { getErrorMessage } from '@/lib/errors'
import { useSearchParams } from 'react-router-dom'

type TrackedComplaint = {
  token: string
  category: ComplaintCategory
  title: string
  description?: string
  status: ComplaintStatus
  adminNote?: string
  roomNumber?: string | null
  createdAt: string
  updatedAt?: string
  resolvedAt?: string
}

export default function TrackComplaintPage() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const urlToken = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams])
  const [token, setToken] = useState(() => urlToken || localStorage.getItem('lastComplaintToken') || '')
  const [submittedToken, setSubmittedToken] = useState(() => urlToken)

  const normalizedToken = useMemo(() => submittedToken.trim().toLowerCase(), [submittedToken])

  const trackQuery = useQuery({
    queryKey: ['track-complaint', normalizedToken],
    queryFn: () =>
      api.get(`/complaints/track/${normalizedToken}`).then((res) => res.data as TrackedComplaint),
    enabled: !!normalizedToken,
    retry: false,
  })

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!urlToken) return
    localStorage.setItem('lastComplaintToken', urlToken)
    const updated = new URLSearchParams(searchParams)
    updated.delete('token')
    setSearchParams(updated, { replace: true })
  }, [searchParams, setSearchParams, urlToken])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <div style={{ width: '100%', maxWidth: 640, display: 'grid', gap: 20 }}>
        <div className="card-glass" style={{ padding: '2rem' }}>
          <h1 style={{ fontFamily: 'Sora', fontSize: 24, marginBottom: 8 }}>Track Complaint</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 18 }}>
            Enter the complaint token to view the latest status update.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              ref={inputRef}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const next = token.trim()
                  if (!next) return
                  localStorage.setItem('lastComplaintToken', next)
                  setSubmittedToken(next)
                }
              }}
              placeholder="Enter complaint token"
              style={{
                flex: 1,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: '12px 14px',
                color: 'var(--text-primary)',
              }}
            />
            <button
              className="btn-primary"
              onClick={() => {
                const next = token.trim()
                if (!next) return
                localStorage.setItem('lastComplaintToken', next)
                setSubmittedToken(next)
              }}
              disabled={!token.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Search size={16} />
              Track
            </button>
          </div>
        </div>

        {trackQuery.isFetching ? <LoadingSpinner /> : null}
        {trackQuery.isError ? (
          <div className="card" style={{ color: 'var(--accent-danger)' }}>
            {getErrorMessage(trackQuery.error, 'Complaint not found. Check the token and try again.')}
          </div>
        ) : null}

        {trackQuery.data ? (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'Sora', fontSize: 20 }}>{trackQuery.data.title}</div>
                <div style={{ color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {trackQuery.data.roomNumber ? `Room ${trackQuery.data.roomNumber} · ` : ''}
                  {trackQuery.data.category} · {trackQuery.data.token}
                </div>
              </div>
              <StatusBadge status={trackQuery.data.status} />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <button
                onClick={async () => {
                  const ok = await copyToClipboard(trackQuery.data!.token)
                  toast.success(ok ? 'Copied token' : 'Could not copy token')
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <Copy size={14} />
                Copy token
              </button>
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/track?token=${encodeURIComponent(trackQuery.data!.token)}`
                  const ok = await copyToClipboard(url)
                  toast.success(ok ? 'Copied link' : 'Could not copy link')
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <Link2 size={14} />
                Share link
              </button>
            </div>
            {trackQuery.data.description ? (
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 16 }}>
                {trackQuery.data.description}
              </p>
            ) : null}
            {trackQuery.data.adminNote ? (
              <div
                style={{
                  marginTop: 16,
                  padding: '0.9rem 1rem',
                  borderRadius: 10,
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.16)',
                }}
              >
                <strong style={{ color: 'var(--accent-secondary)' }}>Admin note:</strong>{' '}
                {trackQuery.data.adminNote}
              </div>
            ) : null}
            <div className="card" style={{ marginTop: 18, padding: '1.25rem' }}>
              <StatusTracker status={trackQuery.data.status} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
