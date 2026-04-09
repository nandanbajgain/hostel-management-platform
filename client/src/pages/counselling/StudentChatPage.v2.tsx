import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  MessageCircle,
  Clock,
  X,
  AlertCircle,
  CheckCheck,
  Loader,
  Heart,
  Phone,
  Award,
  ChevronRight,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useCounsellingSession,
  useMySessionS,
  useCreateSession,
  useSendMessage,
  useSessionAppointments,
  useCreateAppointment,
  useMyJournalEntries,
  useCreateJournalEntry,
} from '../../hooks/useCounsellingSession';
import { useSessionSocket } from '../../hooks/useSessionSocket';
import { useCounsellingStore } from '../../store/counsellingSlice';
import { MoodSelector } from '@/components/counselling/MoodSelector';
import type { CounsellingMessage, Mood } from '../../types';

interface CounsellorProfileData {
  isOnline: boolean;
  user?: { name: string; avatarUrl?: string };
  bio?: string;
  specialties?: string[];
}

export function StudentChatPageV2() {
  const { user } = useAuth();
  const { activeSessionId, setActiveSessionId } = useCounsellingStore();
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [messages, setMessages] = useState<CounsellingMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [counsellorProfile, setCounsellorProfile] = useState<CounsellorProfileData | null>(null);
  const [appointmentAt, setAppointmentAt] = useState('');
  const [appointmentNote, setAppointmentNote] = useState('');
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalShared, setJournalShared] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: session } = useCounsellingSession(activeSessionId);
  const { data: sessions } = useMySessionS();
  const createSessionMutation = useCreateSession();
  const sendMessageMutation = useSendMessage();
  const { data: appointments = [] } = useSessionAppointments(activeSessionId);
  const createAppointmentMutation = useCreateAppointment();
  const { data: journalEntries = [] } = useMyJournalEntries();
  const createJournalMutation = useCreateJournalEntry();

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

  // Update counsellor profile
  useEffect(() => {
    if (session?.counsellor) {
      setCounsellorProfile(session.counsellor as CounsellorProfileData);
    }
  }, [session]);

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

  const handleCreateSession = useCallback(
    async (mood: Mood, topic: string) => {
      try {
        setError(null);
        setIsCreatingSession(true);

        const newSession = await createSessionMutation.mutateAsync({
          mood,
          topic: topic || undefined,
        });

        if (!newSession || !newSession.id) {
          throw new Error('Failed to create session');
        }

        setActiveSessionId(newSession.id);
        setShowMoodSelector(false);
      } catch (err: any) {
        let errorMessage = 'Failed to create session. Please try again.';
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setIsCreatingSession(false);
      }
    },
    [createSessionMutation, setActiveSessionId],
  );

  const handleSendMessage = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!inputText.trim() || !activeSessionId) return;

      try {
        await sendMessageMutation.mutateAsync({
          sessionId: activeSessionId,
          data: { content: inputText, type: 'TEXT' },
        });

        setInputText('');
        inputRef.current?.focus();
      } catch (err) {
        console.error('Message send error:', err);
      }
    },
    [inputText, activeSessionId, sendMessageMutation],
  );

  const counsellorIsOnline = counsellorProfile?.isOnline ?? false;
  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const nextAppointment = appointments
    .filter((a: any) => a.status !== 'CANCELLED' && new Date(a.scheduledAt).getTime() >= Date.now())
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const formatRecentDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getSessionTitle = (sess: any) => {
    const topic = (sess?.topic || '').trim();
    if (topic) return topic;
    if (sess?.mood) return `Session • ${String(sess.mood).toLowerCase()}`;
    return 'Conversation';
  };

  const getSessionPreview = (sess: any) => {
    const messages = Array.isArray(sess?.messages) ? sess.messages : [];
    const lastMessage = messages[messages.length - 1];
    const content = (lastMessage?.content || '').trim();
    if (content) return content;
    return 'Tap to continue this conversation';
  };

  // No active session - welcome screen
  if (!activeSessionId) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50">
        <AnimatePresence>
          {showMoodSelector && (
            <MoodSelector
              onSelect={handleCreateSession}
              isLoading={isCreatingSession}
              onClose={() => setShowMoodSelector(false)}
            />
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 max-w-2xl"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center max-w-md"
          >
            {/* Welcome Icon */}
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Heart className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Talk to Your Counsellor
            </h1>
            <p className="text-lg text-gray-700 mb-2">
              A safe space for your thoughts and concerns
            </p>
            <p className="text-gray-500 mb-8">
              Share what's on your mind. Our trained counsellor is here to listen and support you.
            </p>

            {/* Start Session Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setError(null);
                setShowMoodSelector(true);
              }}
              disabled={isCreatingSession}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 disabled:opacity-60 text-white font-bold py-4 px-6 rounded-full transition-all shadow-lg mb-6 flex items-center justify-center gap-2"
            >
              {isCreatingSession ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Starting Session...
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  Start a Conversation
                </>
              )}
            </motion.button>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Heart, label: 'Confidential' },
                { icon: Clock, label: 'Always Ready' },
                { icon: Award, label: 'Professional' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg shadow-sm">
                  <item.icon className="w-6 h-6 mx-auto mb-2 text-teal-500" />
                  <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowJournalModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-gray-200/70 shadow-sm hover:shadow transition-all text-sm font-semibold text-gray-800"
              >
                <BookOpen className="w-4 h-4 text-teal-600" />
                Journal
              </button>
            </div>

            {/* Recent Sessions */}
            {sessions && sessions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 pt-8 border-t border-gray-200 w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 text-left">Recent Conversations</h2>
                  <span className="text-xs text-gray-500">{Math.min(sessions.length, 4)} shown</span>
                </div>
                <div className="space-y-3">
                  {[...sessions]
                    .sort((a: any, b: any) => {
                      const aTime = new Date(a?.startedAt || 0).getTime();
                      const bTime = new Date(b?.startedAt || 0).getTime();
                      return bTime - aTime;
                    })
                    .slice(0, 4)
                    .map((sess: any) => (
                    <motion.button
                      key={sess.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setError(null);
                        setActiveSessionId(sess.id);
                      }}
                      className="w-full p-4 bg-white/90 backdrop-blur-sm rounded-2xl hover:shadow-md transition-all text-left border border-gray-200/70 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-gray-900 truncate">{getSessionTitle(sess)}</p>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatRecentDate(sess.startedAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {getSessionPreview(sess)}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                sess.status === 'ACTIVE'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : sess.status === 'OPEN'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              {(sess.status || 'OPEN').toString()}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Active session - chat view
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-sky-50 to-white">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
                {counsellorProfile?.user?.name?.charAt(0) || 'C'}
              </div>
              <div
                className={`absolute bottom-0 right-0 w-4 h-4 ${counsellorIsOnline ? 'bg-emerald-500' : 'bg-slate-300'} rounded-full border-2 border-white`}
              />
            </div>

            {/* Counsellor Info */}
            <div>
              <p className="font-semibold text-gray-900">
                {counsellorProfile?.user?.name || 'Counsellor'}
              </p>
              <p className="text-sm text-gray-600">
                {counsellorIsOnline ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full" />
                    Online now
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    Offline
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowJournalModal(true)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-semibold text-gray-800 hidden sm:inline">Journal</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAppointmentModal(true)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-semibold text-gray-800 hidden sm:inline">Appointment</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSessionId(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
        </div>

        {/* Waiting Indicator */}
        {!counsellorIsOnline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-2 bg-amber-50 border-t border-amber-200 flex items-center gap-2 text-amber-800 text-sm"
          >
            <Loader className="w-4 h-4 animate-spin" />
            Your counsellor is offline. Messages will be saved and you'll be notified when they reply.
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAppointmentModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAppointmentModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.97, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 10, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 relative"
            >
              <button
                type="button"
                onClick={() => setShowAppointmentModal(false)}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <h2 className="text-xl font-bold text-gray-900">Request an appointment</h2>
              <p className="text-sm text-gray-600 mt-1">
                Pick a time that works for you. Your counsellor can confirm or reschedule.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Preferred time</label>
                  <input
                    type="datetime-local"
                    value={appointmentAt}
                    onChange={(e) => setAppointmentAt(e.target.value)}
                    className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-300 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-2">Uses your device time zone.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Notes (optional)</label>
                  <textarea
                    value={appointmentNote}
                    onChange={(e) => setAppointmentNote(e.target.value)}
                    rows={4}
                    placeholder="Anything you want your counsellor to know…"
                    className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-300 text-gray-900 placeholder-gray-500"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={!appointmentAt || createAppointmentMutation.isPending}
                  onClick={async () => {
                    if (!activeSessionId) return;
                    await createAppointmentMutation.mutateAsync({
                      sessionId: activeSessionId,
                      data: {
                        scheduledAt: new Date(appointmentAt).toISOString(),
                        note: appointmentNote || undefined,
                      },
                    });
                    setAppointmentNote('');
                    setShowAppointmentModal(false);
                  }}
                  className="w-full mt-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 disabled:opacity-60 text-white font-bold py-3 rounded-full transition-all shadow-lg"
                >
                  {createAppointmentMutation.isPending ? 'Requesting…' : 'Send request'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showJournalModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowJournalModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.97, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 10, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 relative"
            >
              <button
                type="button"
                onClick={() => setShowJournalModal(false)}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Journal</h2>
                  <p className="text-sm text-gray-600 mt-1">A private space to reflect. Share only if you want.</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800 select-none">
                  <input
                    type="checkbox"
                    checked={journalShared}
                    onChange={(e) => setJournalShared(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  Share with counsellor
                </label>
              </div>

              <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Title (optional)</label>
                    <input
                      value={journalTitle}
                      onChange={(e) => setJournalTitle(e.target.value)}
                      placeholder="e.g., Feeling overwhelmed"
                      className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-300 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Entry</label>
                    <textarea
                      value={journalContent}
                      onChange={(e) => setJournalContent(e.target.value)}
                      rows={10}
                      placeholder="Write freely…"
                      className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-300 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={!journalContent.trim() || createJournalMutation.isPending}
                    onClick={async () => {
                      await createJournalMutation.mutateAsync({
                        title: journalTitle.trim() || undefined,
                        content: journalContent.trim(),
                        isShared: journalShared,
                        sessionId: activeSessionId || undefined,
                      });
                      setJournalTitle('');
                      setJournalContent('');
                      setJournalShared(false);
                    }}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-3 rounded-full transition-all shadow-md"
                  >
                    {createJournalMutation.isPending ? 'Saving…' : 'Save entry'}
                  </motion.button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-gray-900">Recent entries</p>
                    <p className="text-xs text-gray-500">{journalEntries.length}</p>
                  </div>
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                    {journalEntries.length === 0 ? (
                      <p className="text-sm text-gray-500">No entries yet.</p>
                    ) : (
                      journalEntries.slice(0, 12).map((entry: any) => (
                        <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {entry.title || 'Journal entry'}
                            </p>
                            <span className="text-[11px] text-gray-500 flex-shrink-0">
                              {formatDateTime(entry.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-3">{entry.content}</p>
                          {entry.isShared ? (
                            <span className="inline-flex mt-2 text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                              Shared
                            </span>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {nextAppointment ? (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/85 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Next appointment
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  {formatDateTime(nextAppointment.scheduledAt)} • {nextAppointment.durationMins} min •{' '}
                  <span className="font-semibold">{nextAppointment.status}</span>
                </p>
                {nextAppointment.meetingLink ? (
                  <a
                    href={nextAppointment.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-teal-700 hover:text-teal-800 underline mt-2 inline-block"
                  >
                    Open meeting link
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setShowAppointmentModal(true)}
                className="px-3 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 font-semibold text-sm hover:bg-teal-100 transition-all"
              >
                Request another
              </button>
            </div>
          </div>
        ) : null}
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-5 py-3 rounded-2xl shadow-sm ${
                  msg.senderId === user?.id
                    ? 'bg-gradient-to-br from-teal-500 to-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-base leading-relaxed">{msg.content}</p>

                {/* Message Footer */}
                <div className={`text-xs mt-2 flex items-center gap-1 ${
                  msg.senderId === user?.id ? 'text-teal-100' : 'text-gray-500'
                }`}>
                  <span>{formatTime(msg.sentAt)}</span>
                  {msg.senderId === user?.id && (
                    <CheckCheck className="w-3 h-3" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 items-center"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600">C</span>
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
      <div className="border-t border-gray-200 bg-gradient-to-r from-white via-teal-50 to-white px-4 sm:px-6 py-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex-1 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm focus-within:ring-2 focus-within:ring-teal-500/40 focus-within:border-teal-300 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                counsellorIsOnline
                  ? 'Type your message...'
                  : 'Your message will be sent when your counsellor is online...'
              }
              disabled={!activeSessionId}
              className="w-full bg-transparent px-5 py-3 text-gray-900 placeholder-gray-500 caret-teal-600 focus:outline-none disabled:text-gray-500 disabled:cursor-not-allowed"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!inputText.trim() || !activeSessionId}
            className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 disabled:opacity-50 text-white h-12 w-12 rounded-full transition-all shadow-md flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
