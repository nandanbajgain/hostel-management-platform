export type Role = 'STUDENT' | 'WARDEN' | 'ADMIN' | 'COUNSELLOR'
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
  coursePreference?: string
  gender?: Gender
  sportsInterests?: string[]
  hobbies?: string[]
  sleepSchedule?: string
  noiseTolerance?: string
  studyHours?: number
  sleepHours?: number
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
  roomNumber?: string | null
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
  isPublic?: boolean
  createdByUser?: Pick<User, 'id' | 'name' | 'email'>
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

// Counselling types
export type SessionStatus = 'OPEN' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
export type Mood = 'ANXIOUS' | 'SAD' | 'STRESSED' | 'OKAY' | 'GOOD'
export type MessageType = 'TEXT' | 'RESOURCE' | 'NOTE'

export interface CounsellorProfile {
  id: string
  userId: string
  bio?: string
  specialties: string[]
  availability?: string
  isOnline: boolean
  createdAt: string
  updatedAt: string
  user: User
}

export interface CounsellingMessage {
  id: string
  sessionId: string
  senderId: string
  sender?: User
  content: string
  type: MessageType
  isRead: boolean
  sentAt: string
}

export interface CounsellingSession {
  id: string
  studentId: string
  counsellorId: string
  student?: User
  counsellor?: CounsellorProfile
  status: SessionStatus
  topic?: string
  mood?: Mood
  startedAt: string
  closedAt?: string | null
  messages?: CounsellingMessage[]
  sessionNotes?: string
  followUpDate?: string | null
  rating?: number | null
  ratingComment?: string | null
  createdAt: string
  updatedAt: string
}
