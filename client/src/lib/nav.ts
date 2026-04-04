import type { Role } from '@/types'
import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  BedDouble,
  EyeOff,
  Home,
  LayoutDashboard,
  Search,
  UserCheck,
  Wrench,
} from 'lucide-react'

export type NavItem = { to: string; icon: LucideIcon; label: string }

const studentNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-room', icon: Home, label: 'My Room' },
  { to: '/complaints', icon: AlertCircle, label: 'My Complaints' },
  { to: '/complaints/anonymous', icon: EyeOff, label: 'Report Anonymously' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/track', icon: Search, label: 'Track Complaint' },
]

const adminNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: BedDouble, label: 'Room Management' },
  { to: '/admin/complaints', icon: AlertCircle, label: 'Complaints' },
  { to: '/students', icon: UserCheck, label: 'Students' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
]

const wardenNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: BedDouble, label: 'Rooms' },
  { to: '/admin/complaints', icon: AlertCircle, label: 'Complaints' },
  { to: '/students', icon: UserCheck, label: 'Students' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
]

export function getNavItems(role: Role | undefined): NavItem[] {
  if (role === 'ADMIN') return adminNav
  if (role === 'WARDEN') return wardenNav
  return studentNav
}

