export type Role = 'STUDENT' | 'WARDEN' | 'ADMIN'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'
export type ComplaintStatus = 'PENDING' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
export type ComplaintCategory = 'PLUMBING' | 'ELECTRICAL' | 'CLEANING' | 'FURNITURE' | 'SECURITY' | 'FOOD' | 'INTERNET' | 'OTHER'
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  avatarUrl?: string
  enrollmentNo?: string
  course?: string
  gender?: Gender
  sportsInterests?: string[]
  careerGoal?: string
  address?: string
  parentContactNo?: string
  approvalStatus?: ApprovalStatus
  approvedAt?: string
  approvedBy?: string
}

export interface Room {
  id: string
  number: string
  floor: number
  block: string
  capacity: number
  status: RoomStatus
  amenities: string[]
  occupants?: User[]
}

export interface Complaint {
  id: string
  token: string
  isAnonymous: boolean
  category: ComplaintCategory
  title: string
  description: string
  imageUrl?: string
  status: ComplaintStatus
  adminNote?: string
  createdAt: string
  updatedAt?: string
  resolvedAt?: string
  user?: Pick<User, 'id' | 'name' | 'email'>
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {
  totalStudents: number
  occupiedRooms: number
  availableRooms: number
  openComplaints: number
  pendingMaintenance: number
  occupancyPercent: number
}

export interface AdminDashboardStats extends DashboardStats {
  totalRooms: number
  recentActivity: Array<{
    id: string
    title: string
    category: ComplaintCategory
    status: ComplaintStatus
    createdAt: string
    isAnonymous: boolean
    user: { name: string } | null
  }>
}

export interface MaintenanceTask {
  id: string
  title: string
  description: string
  location: string
  assignedTo?: string
  status: MaintenanceStatus
  scheduledAt: string
  completedAt?: string | null
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  isUrgent: boolean
  createdBy: string
  expiresAt?: string | null
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Array<{
    id: string
    title: string | null
    type: string | null
    score: number
  }>
}
