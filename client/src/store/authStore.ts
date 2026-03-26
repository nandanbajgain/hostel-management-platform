import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/services/api'
import type { User } from '@/types'

interface AuthStore {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isHydrated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken:
        typeof window !== 'undefined'
          ? window.localStorage.getItem('accessToken')
          : null,
      isAuthenticated: false,
      isHydrated: false,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        localStorage.setItem('accessToken', res.data.accessToken)
        set({
          user: res.data.user,
          accessToken: res.data.accessToken,
          isAuthenticated: true,
        })
      },

      logout: () => {
        api.post('/auth/logout').catch(() => {})
        localStorage.removeItem('accessToken')
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        })
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-store',
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ isHydrated: true })
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
