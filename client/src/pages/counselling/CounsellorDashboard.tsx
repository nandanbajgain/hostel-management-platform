import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Star, TrendingUp } from 'lucide-react';
import {
  useCounsellorDashboard,
  useCounsellorStats,
  useStudentProfile,
} from '../../hooks/useCounsellingSession';
import { useAuth } from '../../hooks/useAuth';
import type { CounsellingSession } from '../../types';

export function CounsellorDashboard() {
  const { user } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sessions } = useCounsellorDashboard({ limit: 50 });
  const { data: stats } = useCounsellorStats();
  const selectedSession = sessions?.find((s: CounsellingSession) => s.id === selectedSessionId);
  const { data: studentProfile } = useStudentProfile(selectedSession?.studentId || null);

  const filteredSessions = sessions?.filter((s: CounsellingSession) =>
    s.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel - Sessions */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Stats Strip */}
        <div className="p-4 grid grid-cols-2 gap-2 bg-gradient-to-r from-teal-50 to-blue-50">
          <div className="p-3 bg-white rounded-lg border border-teal-200">
            <div className="flex items-center gap-1 mb-1">
              <MessageSquare className="w-4 h-4 text-teal-500" />
              <span className="text-xs text-gray-500">Open Sessions</span>
            </div>
            <p className="text-2xl font-bold text-teal-600">{stats?.openSessions}</p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-teal-200">
            <div className="flex items-center gap-1 mb-1">
              <Users className="w-4 h-4 text-teal-500" />
              <span className="text-xs text-gray-500">Helped Students</span>
            </div>
            <p className="text-2xl font-bold text-teal-600">{stats?.uniqueStudents}</p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-teal-200">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-teal-500" />
              <span className="text-xs text-gray-500">This Week</span>
            </div>
            <p className="text-2xl font-bold text-teal-600">{stats?.thisWeekSessions}</p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-teal-200">
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-4 h-4 text-teal-500" />
              <span className="text-xs text-gray-500">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold text-teal-600">{stats?.averageRating?.toFixed(1)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions?.map((session: CounsellingSession) => (
            <motion.button
              key={session.id}
              onClick={() => setSelectedSessionId(session.id)}
              className={`w-full p-4 border-b border-gray-100 text-left transition-all hover:bg-gray-50 ${
                selectedSessionId === session.id ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
              }`}
              whileHover={{ backgroundColor: '#f9fafb' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-sm font-semibold">
                  {session.student?.name?.charAt(0) || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{session.student?.name}</p>
                  <p className="text-xs text-gray-500">{session.topic || 'General session'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded-full text-white ${
                  session.status === 'OPEN' ? 'bg-green-500' :
                  session.status === 'ACTIVE' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`}>
                  {session.status}
                </span>
                <span className="text-gray-500">
                  {new Date(session.startedAt).toLocaleDateString()}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Right Panel - Chat/Details */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Student Profile Strip */}
            {studentProfile && (
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold text-lg">
                      {studentProfile.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{studentProfile.name}</p>
                      <p className="text-sm text-gray-500">{studentProfile.course}</p>
                    </div>
                  </div>
                  {studentProfile.allocation?.room && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Room: <span className="font-semibold">{studentProfile.allocation.room.number}</span></p>
                      <p className="text-sm text-gray-600">Block: <span className="font-semibold">{studentProfile.allocation.room.block}</span></p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-teal-50 to-blue-50 space-y-4">
              {selectedSession.messages?.map((msg: any, idx: number) => (
                <motion.div
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
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
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg transition-all font-semibold">
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Select a conversation to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
