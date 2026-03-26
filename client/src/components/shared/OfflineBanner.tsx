import { useEffect, useState } from 'react'

const healthUrl = `${import.meta.env.VITE_API_URL}/api/v1/health`

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let mounted = true

    const check = async () => {
      try {
        const response = await fetch(healthUrl)
        if (!mounted) return
        setOffline(!response.ok)
      } catch {
        if (!mounted) return
        setOffline(true)
      }
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
      }}
    >
      Backend offline — check server
    </div>
  )
}
