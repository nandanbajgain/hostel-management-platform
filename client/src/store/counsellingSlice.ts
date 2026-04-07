import { create } from 'zustand';
import type { CounsellingSession } from '../types';

interface CounsellingState {
  activeSessionId: string | null;
  sessions: CounsellingSession[];
  unreadCount: number;
  counsellorOnline: boolean;
  typingIndicator: boolean;
  typingUser: string | null;

  setActiveSessionId: (sessionId: string | null) => void;
  setSessions: (sessions: CounsellingSession[]) => void;
  addSession: (session: CounsellingSession) => void;
  updateSession: (session: CounsellingSession) => void;
  setUnreadCount: (count: number) => void;
  setCounsellorOnline: (online: boolean) => void;
  setTypingIndicator: (typing: boolean, user?: string) => void;
}

export const useCounsellingStore = create<CounsellingState>((set) => ({
  activeSessionId: null,
  sessions: [],
  unreadCount: 0,
  counsellorOnline: false,
  typingIndicator: false,
  typingUser: null,

  setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
    })),
  updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    })),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setCounsellorOnline: (online) => set({ counsellorOnline: online }),
  setTypingIndicator: (typing, user) =>
    set({ typingIndicator: typing, typingUser: user || null }),
}));
