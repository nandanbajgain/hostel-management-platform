import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage } from '@/types'

interface ChatStore {
  messages: ChatMessage[]
  isOpen: boolean
  setOpen: (open: boolean) => void
  addMessage: (msg: ChatMessage) => void
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,
      setOpen: (open) => set({ isOpen: open }),
      addMessage: (msg) =>
        set((state) => ({
          messages: [...state.messages, msg],
        })),
      updateMessage: (id, patch) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
)
