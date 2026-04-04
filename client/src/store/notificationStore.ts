import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification } from '@/types'

type IncomingNotification = Partial<Notification> &
  Pick<Notification, 'id' | 'title' | 'message' | 'type'>

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  addNotification: (n: IncomingNotification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clear: () => void
  setNotifications: (ns: Notification[]) => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (n) =>
        set((state) => {
          const next: Notification[] = [
            {
              ...n,
              isRead: n.isRead ?? false,
              createdAt: n.createdAt ?? new Date().toISOString(),
            } as Notification,
            ...state.notifications,
          ]

          const unreadCount = next.filter((item) => !item.isRead).length
          return { notifications: next.slice(0, 50), unreadCount }
        }),
      markRead: (id) =>
        set((state) => {
          const next = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          )
          return { notifications: next, unreadCount: next.filter((n) => !n.isRead).length }
        }),
      markAllRead: () =>
        set((state) => ({
          unreadCount: 0,
          notifications: state.notifications.map((notification) => ({
            ...notification,
            isRead: true,
          })),
        })),
      clear: () => set({ notifications: [], unreadCount: 0 }),
      setNotifications: (ns) =>
        set({ notifications: ns, unreadCount: ns.filter((n) => !n.isRead).length }),
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
)
