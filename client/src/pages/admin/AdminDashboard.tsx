import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertCircle, BedDouble, Users, Wrench } from 'lucide-react'
import api from '@/services/api'
import AnnouncementsPanel from '@/components/announcements/AnnouncementsPanel'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatsGridSkeleton from '@/components/shared/StatsGridSkeleton'
import StatusBadge from '@/components/shared/StatusBadge'
import StatsGrid from '@/components/dashboard/StatsGrid'

const weekData = [
  { day: 'Mon', complaints: 3, resolved: 2 },
  { day: 'Tue', complaints: 5, resolved: 4 },
  { day: 'Wed', complaints: 2, resolved: 2 },
  { day: 'Thu', complaints: 7, resolved: 5 },
  { day: 'Fri', complaints: 4, resolved: 3 },
  { day: 'Sat', complaints: 6, resolved: 6 },
  { day: 'Sun', complaints: 1, resolved: 1 },
]

const categoryData = [
  { subject: 'Plumbing', A: 65 },
  { subject: 'Electrical', A: 45 },
  { subject: 'Cleaning', A: 80 },
  { subject: 'Furniture', A: 30 },
  { subject: 'Internet', A: 55 },
  { subject: 'Security', A: 20 },
]

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/admin-stats').then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: recentComplaints } = useQuery({
    queryKey: ['recent-complaints'],
    queryFn: () => api.get('/complaints').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gap: 24 }}>
        <StatsGridSkeleton />
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'Sora', fontSize: 24, margin: 0 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          South Asian University live operations overview.
        </p>
      </div>

      <StatsGrid
        items={[
          {
            icon: Users,
            label: 'Total Students',
            value: stats?.totalStudents ?? 0,
            sub: `${stats?.occupancyPercent ?? 0}% occupancy`,
            color: '#6C63FF',
          },
          {
            icon: BedDouble,
            label: 'Rooms Available',
            value: stats?.availableRooms ?? 0,
            sub: `${stats?.occupiedRooms ?? 0} occupied`,
            color: '#22D3EE',
          },
          {
            icon: AlertCircle,
            label: 'Open Complaints',
            value: stats?.openComplaints ?? 0,
            sub: stats?.openComplaints > 10 ? 'Needs attention' : 'Under control',
            color: stats?.openComplaints > 10 ? '#EF4444' : '#10B981',
          },
          {
            icon: Wrench,
            label: 'Pending Maintenance',
            value: stats?.pendingMaintenance ?? 0,
            sub: 'Scheduled and active',
            color: '#F59E0B',
          },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontFamily: 'Sora', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            Complaints this week
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1A2235', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F1F5F9' }} />
              <Area type="monotone" dataKey="complaints" stroke="#6C63FF" fill="url(#cg)" strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" stroke="#10B981" fill="none" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'Sora', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            Complaints by category
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={categoryData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
              <Radar dataKey="A" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip contentStyle={{ background: '#1A2235', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F1F5F9' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: 'Sora', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
          Recent Complaints
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {(recentComplaints || []).slice(0, 8).map((complaint: any) => (
            <div key={complaint.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{complaint.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {complaint.isAnonymous ? 'Anonymous' : complaint.user?.name} · {complaint.category}
                </div>
              </div>
              <StatusBadge status={complaint.status} />
            </div>
          ))}
        </div>
      </div>

      <AnnouncementsPanel />
    </div>
  )
}
