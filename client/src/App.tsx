import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import OfflineBanner from '@/components/shared/OfflineBanner'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'))
const MyRoomPage = lazy(() => import('@/pages/student/MyRoomPage'))
const ComplaintsPage = lazy(() => import('@/pages/student/ComplaintsPage'))
const AnonymousComplaintPage = lazy(
  () => import('@/pages/student/AnonymousComplaintPage')
)
const TrackComplaintPage = lazy(() => import('@/pages/student/TrackComplaintPage'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const RoomManagement = lazy(() => import('@/pages/admin/RoomManagement'))
const ComplaintsAdmin = lazy(() => import('@/pages/admin/ComplaintsAdmin'))
const MaintenanceAdmin = lazy(() => import('@/pages/admin/MaintenanceAdmin'))
const StudentManagement = lazy(() => import('@/pages/admin/StudentManagement'))
const WardenDashboard = lazy(() => import('@/pages/warden/WardenDashboard'))

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: string[]
}) {
  const { isAuthenticated, isHydrated, user } = useAuthStore()

  if (!isHydrated) {
    return <LoadingSpinner fullScreen />
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { user } = useAuthStore()

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OfflineBanner />
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/track" element={<TrackComplaintPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="dashboard"
                  element={
                    user?.role === 'ADMIN' ? (
                      <AdminDashboard />
                    ) : user?.role === 'WARDEN' ? (
                      <WardenDashboard />
                    ) : (
                      <StudentDashboard />
                    )
                  }
                />
                <Route
                  path="rooms"
                  element={
                    <ProtectedRoute roles={['ADMIN', 'WARDEN']}>
                      <RoomManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="my-room"
                  element={
                    <ProtectedRoute roles={['STUDENT']}>
                      <MyRoomPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="complaints" element={<ComplaintsPage />} />
                <Route
                  path="complaints/anonymous"
                  element={<AnonymousComplaintPage />}
                />
                <Route
                  path="admin/complaints"
                  element={
                    <ProtectedRoute roles={['ADMIN', 'WARDEN']}>
                      <ComplaintsAdmin />
                    </ProtectedRoute>
                  }
                />
                <Route path="maintenance" element={<MaintenanceAdmin />} />
                <Route
                  path="students"
                  element={
                    <ProtectedRoute roles={['ADMIN', 'WARDEN']}>
                      <StudentManagement />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
