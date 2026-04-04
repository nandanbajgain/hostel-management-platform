import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, BedDouble, ShieldCheck, Wrench } from 'lucide-react'
import api from '@/services/api'
import AnnouncementsPanel from '@/components/announcements/AnnouncementsPanel'
import StatsGrid from '@/components/dashboard/StatsGrid'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatsGridSkeleton from '@/components/shared/StatsGridSkeleton'
import type { AdminDashboardStats } from '@/types'

export default function WardenDashboard() {
  const dashboardQuery = useQuery({
    queryKey: ['warden-dashboard'],
    queryFn: () => api.get('/dashboard/admin-stats').then((res) => res.data as AdminDashboardStats),
  })

  if (dashboardQuery.isLoading) {
    return (
      <div style={{ display: 'grid', gap: 24 }}>
        <StatsGridSkeleton />
        <LoadingSpinner />
      </div>
    )
  }

  const stats = dashboardQuery.data

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0 }}>Warden Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Daily operating summary across occupancy and resident issues.
        </p>
      </div>

      <StatsGrid
        items={[
          {
            icon: BedDouble,
            label: 'Total Rooms',
            value: stats?.totalRooms ?? 0,
            sub: `${stats?.availableRooms ?? 0} available`,
            color: '#6C63FF',
          },
          {
            icon: ShieldCheck,
            label: 'Active Residents',
            value: stats?.totalStudents ?? 0,
            sub: 'Current allocations',
            color: '#22D3EE',
          },
          {
            icon: AlertTriangle,
            label: 'Open Complaints',
            value: stats?.openComplaints ?? 0,
            sub: 'Needs supervision',
            color: '#EF4444',
          },
          {
            icon: Wrench,
            label: 'Maintenance Rooms',
            value: stats?.pendingMaintenance ?? 0,
            sub: 'Unavailable rooms',
            color: '#F59E0B',
          },
        ]}
      />

      <ActivityFeed
        title="Recent Resident Issues"
        items={(stats?.recentActivity || []).slice(0, 6).map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: `${item.isAnonymous ? 'Anonymous' : item.user?.name || 'Student'} · ${item.category}`,
          status: item.status,
          timestamp: item.createdAt,
        }))}
      />

      <AnnouncementsPanel />
    </div>
  )
}
