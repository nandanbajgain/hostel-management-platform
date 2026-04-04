import { useEffect, useState } from 'react'

const healthUrl = `${import.meta.env.VITE_API_URL}/api/v1/health`

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    let mounted = true

    const check = async () => {
      setChecking(true)
      try {
        const controller = new AbortController()
        const t = window.setTimeout(() => controller.abort(), 4000)
        const response = await fetch(healthUrl, { signal: controller.signal })
        window.clearTimeout(t)
        if (mounted) setOffline(!response.ok)
      } catch {
        if (mounted) setOffline(true)
      }

      if (!mounted) return
      setChecking(false)
      setLastChecked(new Date().toISOString())
    }

    check()
    const timer = window.setInterval(check, 15000)

    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: 'rgba(239,68,68,0.14)',
        borderBottom: '1px solid rgba(239,68,68,0.35)',
        color: '#fecaca',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <span>Backend offline — check server</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: 'transparent',
          border: '1px solid rgba(239,68,68,0.35)',
          color: '#fecaca',
          padding: '4px 10px',
          borderRadius: 999,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {checking ? 'Checking…' : 'Retry'}
      </button>
      <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>
        {lastChecked ? `Last checked ${new Date(lastChecked).toLocaleTimeString()}` : null}
      </span>
    </div>
  )
}
