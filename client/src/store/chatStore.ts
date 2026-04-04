import { create } from 'zustand'
import type { ChatMessage } from '@/types'

interface ChatStore {
  messages: ChatMessage[]
  isOpen: boolean
  setOpen: (open: boolean) => void
  addMessage: (msg: ChatMessage) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
  clearMessages: () => set({ messages: [] }),
}))
