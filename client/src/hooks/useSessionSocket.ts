import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import type { Socket } from 'socket.io-client';

interface UseSessionSocketOptions {
  sessionId: string;
  onMessage?: (message: any) => void;
  onTyping?: (data: any) => void;
  onRead?: (userId: string) => void;
  onCounsellorStatus?: (data: any) => void;
}

export function useSessionSocket({
  sessionId,
  onMessage,
  onTyping,
  onRead,
  onCounsellorStatus,
}: UseSessionSocketOptions) {
  const socket: Socket | null = getSocket();

  useEffect(() => {
    if (!socket || !sessionId) return;

    // Join session
    socket.emit('counselling:join-session', { sessionId });

    // Listen for messages
    const messageHandler = (message: any) => {
      onMessage?.(message);
    };
    socket.on('counselling:message', messageHandler);

    // Listen for typing
    const typingHandler = (data: any) => {
      onTyping?.(data);
    };
    socket.on('counselling:typing', typingHandler);

    // Listen for read status
    const readHandler = (data: any) => {
      onRead?.(data.userId);
    };
    socket.on('counselling:messages-read', readHandler);

    // Listen for counsellor status
    const statusHandler = (data: any) => {
      onCounsellorStatus?.(data);
    };
    socket.on('counselling:counsellor-status-updated', statusHandler);

    return () => {
      socket.off('counselling:message', messageHandler);
      socket.off('counselling:typing', typingHandler);
      socket.off('counselling:messages-read', readHandler);
      socket.off('counselling:counsellor-status-updated', statusHandler);
    };
  }, [socket, sessionId, onMessage, onTyping, onRead, onCounsellorStatus]);

  return socket;
}
