import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  BedDouble,
  ChevronLeft,
  EyeOff,
  Home,
  LayoutDashboard,
  LogOut,
  Search,
  UserCheck,
  Wrench,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import sauLogo from '@/assets/sau-logo.png'

const studentNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-room', icon: Home, label: 'My Room' },
  { to: '/complaints', icon: AlertCircle, label: 'My Complaints' },
  { to: '/complaints/anonymous', icon: EyeOff, label: 'Report Anonymously' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/track', icon: Search, label: 'Track Complaint' },
]

const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: BedDouble, label: 'Room Management' },
  { to: '/admin/complaints', icon: AlertCircle, label: 'Complaints' },
  { to: '/students', icon: UserCheck, label: 'Students' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
]

const wardenNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: BedDouble, label: 'Rooms' },
  { to: '/admin/complaints', icon: AlertCircle, label: 'Complaints' },
  { to: '/students', icon: UserCheck, label: 'Students' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
]

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const navItems =
    user?.role === 'ADMIN' ? adminNav : user?.role === 'WARDEN' ? wardenNav : studentNav

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        zIndex: 50,
        background: 'linear-gradient(180deg, rgba(17,24,39,0.96), rgba(10,15,30,0.98))',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={sauLogo}
            alt="South Asian University logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontFamily: 'Sora',
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            HostelSync
          </motion.span>
        )}
      </div>

      <nav
        style={{
          flex: 1,
          padding: '0.75rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: collapsed ? '10px 16px' : '10px 12px',
              borderRadius: 10,
              textDecoration: 'none',
              transition: 'all 0.15s',
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive
                ? 'linear-gradient(135deg, var(--accent-primary), rgba(34,211,238,0.55))'
                : 'transparent',
              borderLeft:
                isActive && !collapsed
                  ? '2px solid rgba(255,255,255,0.4)'
                  : '2px solid transparent',
            })}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && (
              <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' }}>
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid var(--border-default)' }}>
        {!collapsed && (
          <div
            style={{
              padding: '8px 12px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 600,
                color: 'white',
              }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user?.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: collapsed ? '10px 16px' : '10px 12px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: 'var(--accent-danger)',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <LogOut size={18} />
          {!collapsed && <span style={{ fontSize: 14, fontWeight: 500 }}>Logout</span>}
        </button>
        <button
          onClick={onToggle}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
            padding: '8px 12px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
          }}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft size={16} />
          </motion.div>
        </button>
      </div>
    </motion.aside>
  )
}
