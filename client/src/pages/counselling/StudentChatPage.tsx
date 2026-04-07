import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Clock, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useCounsellingSession,
  useMySessionS,
  useCreateSession,
  useSendMessage,
} from '../../hooks/useCounsellingSession';
import { useSessionSocket } from '../../hooks/useSessionSocket';
import { useCounsellingStore } from '../../store/counsellingSlice';
import { MoodSelector } from '@/components/counselling/MoodSelector';
import type { CounsellingMessage, Mood } from '../../types';

export function StudentChatPage() {
  const { user } = useAuth();
  const { activeSessionId, setActiveSessionId } = useCounsellingStore();
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [messages, setMessages] = useState<CounsellingMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: session } = useCounsellingSession(activeSessionId);
  const { data: sessions } = useMySessionS();
  const createSessionMutation = useCreateSession();
  const sendMessageMutation = useSendMessage();

  // Socket setup
  useSessionSocket({
    sessionId: activeSessionId || '',
    onMessage: (message) => {
      setMessages((prev) => [...prev, message]);
    },
    onTyping: (data) => {
      if (data.userId !== user?.id) {
        setIsTyping(data.isTyping);
      }
    },
  });

  // Load messages when session changes
  useEffect(() => {
    if (session?.messages) {
      setMessages(session.messages);
    }
  }, [session]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateSession = async (mood: Mood, topic: string) => {
    const newSession = await createSessionMutation.mutateAsync({
      mood,
      topic: topic || undefined,
    });
    setActiveSessionId(newSession.id);
    setShowMoodSelector(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeSessionId) return;

    await sendMessageMutation.mutateAsync({
      sessionId: activeSessionId,
      data: { content: inputText, type: 'TEXT' },
    });

    setInputText('');
  };

  if (!activeSessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
        <AnimatePresence>{showMoodSelector && <MoodSelector onSelect={handleCreateSession} />}</AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-teal-500" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Talk to Your Counsellor</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            You're not alone. Your counsellor is here to listen and support you through any challenges.
          </p>

          <button
            onClick={() => setShowMoodSelector(true)}
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-8 rounded-full transition-all"
          >
            Start a Session
          </button>

          {sessions && sessions.length > 0 && (
            <div className="mt-8 text-left max-w-md">
              <h2 className="font-semibold text-gray-800 mb-4">Recent Conversations</h2>
              <div className="space-y-2">
                {sessions.map((sess: any) => (
                  <motion.button
                    key={sess.id}
                    onClick={() => setActiveSessionId(sess.id)}
                    className="w-full p-4 bg-white rounded-lg hover:shadow-md transition-all text-left"
                  >
                    <p className="font-medium text-gray-800">{sess.topic || 'Untitled'}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(sess.startedAt).toLocaleDateString()}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
            {session?.counsellor?.user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{session?.counsellor?.user?.name || 'Counsellor'}</p>
            <p className="text-sm text-gray-500">Student Wellbeing Counsellor</p>
          </div>
        </div>
        <button
          onClick={() => setActiveSessionId(null)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.senderId === user?.id
                  ? 'bg-teal-500 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.sentAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <span className="text-sm text-gray-500">Counsellor is typing</span>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-lg transition-all"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
