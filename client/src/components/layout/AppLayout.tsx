import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import { useSocket } from '@/hooks/useSocket'
import ChatWidget from '@/components/chatbot/ChatWidget'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUIStore } from '@/store/uiStore'

export default function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 900px)')
  const { sidebarCollapsed, toggleSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } =
    useUIStore()
  useSocket()

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'radial-gradient(circle at top left, rgba(108,99,255,0.08), transparent 25%), var(--bg-primary)',
      }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebarCollapsed}
        isMobile={isMobile}
        mobileOpen={isMobile ? mobileSidebarOpen : true}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      {isMobile && mobileSidebarOpen ? (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(0,0,0,0.35)',
          }}
        />
      ) : null}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginLeft: isMobile ? 0 : sidebarCollapsed ? 64 : 240,
          transition: 'margin 0.3s ease',
        }}
      >
        <Header />
        <main style={{ flex: 1, padding: isMobile ? '1rem' : '1.5rem 2rem', overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}
