import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  MessageSquare,
  Search,
  Phone,
  MoreVertical,
  CheckCheck,
} from 'lucide-react';
import {
  useCounsellorDashboard,
  useCounsellorStats,
  useSendMessage,
} from '../../hooks/useCounsellingSession';
import { useAuth } from '../../hooks/useAuth';
import { useSessionSocket } from '../../hooks/useSessionSocket';
import type { CounsellingSession } from '../../types';

export function CounsellorDashboardV2() {
  const { user } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: sessions = [] } = useCounsellorDashboard({ limit: 50 });
  const { data: stats } = useCounsellorStats();
  const sendMessageMutation = useSendMessage();

  const selectedSession = sessions.find((s: CounsellingSession) => s.id === selectedSessionId);

  // Socket setup for real-time messages
  useSessionSocket({
    sessionId: selectedSessionId || '',
    onMessage: (message) => {
      setMessages((prev) => [...prev, message]);
    },
    onTyping: (data) => {
      if (data.userId !== user?.id) {
        setIsTyping(data.isTyping);
      }
    },
  });

  // Update messages when session changes
  useEffect(() => {
    if (selectedSession?.messages) {
      setMessages(selectedSession.messages);
    } else {
      setMessages([]);
    }
  }, [selectedSessionId, selectedSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!inputText.trim() || !selectedSessionId) return;

      try {
        await sendMessageMutation.mutateAsync({
          sessionId: selectedSessionId,
          data: { content: inputText, type: 'TEXT' },
        });

        setInputText('');
        inputRef.current?.focus();
      } catch (err) {
        console.error('Message send error:', err);
      }
    },
    [inputText, selectedSessionId, sendMessageMutation],
  );

  const filteredSessions = sessions.filter((s: CounsellingSession) =>
    s.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Sidebar - Sessions List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-all"
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-gray-200 grid grid-cols-2 gap-2">
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-500">Open</div>
            <div className="text-lg font-bold text-teal-600">{stats?.openSessions || 0}</div>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-500">This Week</div>
            <div className="text-lg font-bold text-teal-600">{stats?.thisWeekSessions || 0}</div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto space-y-1 p-2">
          <AnimatePresence>
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session: CounsellingSession) => (
                <motion.button
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedSessionId === session.id
                      ? 'bg-teal-100 hover:bg-teal-100'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {session.student?.name?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{session.student?.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {session.messages?.[0]?.content || session.topic || 'General session'}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full text-white font-medium ${
                        session.status === 'OPEN'
                          ? 'bg-emerald-500'
                          : session.status === 'ACTIVE'
                            ? 'bg-blue-500'
                            : 'bg-gray-500'
                      }`}
                    >
                      {session.status}
                    </span>
                    <span className="text-gray-400">
                      {new Date(session.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations found</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 to-teal-50">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">
                  {selectedSession.student?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedSession.student?.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedSession.topic || `Mood: ${selectedSession.mood}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </motion.div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full"
                  >
                    <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Conversation started</p>
                    <p className="text-sm text-gray-400">Messages will appear here</p>
                  </motion.div>
                ) : (
                  messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
                          msg.senderId === user?.id
                            ? 'bg-teal-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="leading-relaxed break-words">{msg.content}</p>
                        <div
                          className={`text-xs mt-2 flex items-center gap-1 ${
                            msg.senderId === user?.id ? 'text-teal-100' : 'text-gray-500'
                          }`}
                        >
                          <span>{formatTime(msg.sentAt)}</span>
                          {msg.senderId === user?.id && (
                            <CheckCheck className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 items-center"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-600">
                      {selectedSession.student?.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white p-3 rounded-full transition-all shadow-md flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </form>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <MessageSquare className="w-20 h-20 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Select a Conversation</h2>
            <p className="text-gray-500">Choose a student to start chatting</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
