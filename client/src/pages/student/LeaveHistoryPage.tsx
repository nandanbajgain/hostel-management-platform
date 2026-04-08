import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Plus,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getSocket } from '../../lib/socket'
import { leaveApi } from '../../services/leave'

interface Leave {
  id: string;
  leaveType: string;
  reason: string;
  fromDate: string;
  toDate: string;
  destination: string;
  contactNumber: string;
  parentContact: string;
  status: string;
  wardenRemark?: string;
  adminRemark?: string;
  createdAt: string;
}

const statusConfig = {
  PENDING: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending', icon: Clock },
  APPROVED_BY_WARDEN: {
    color: 'bg-blue-500/20 text-blue-400',
    label: 'Warden Approved',
    icon: CheckCircle,
  },
  APPROVED: { color: 'bg-emerald-500/20 text-emerald-400', label: 'Approved', icon: CheckCircle },
  REJECTED: { color: 'bg-red-500/20 text-red-400', label: 'Rejected', icon: XCircle },
  CANCELLED: { color: 'bg-gray-500/20 text-gray-400', label: 'Cancelled', icon: XCircle },
};

export default function LeaveHistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['myLeaves'],
    queryFn: () => leaveApi.getMyLeaves().then((res: any) => res.data),
  })

  // Listen for leave status updates via Socket.IO
  useEffect(() => {
    const socket = getSocket()
    if (!socket.connected) {
      socket.connect()
    }

    const handleLeaveUpdated = (data: any) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] })
    }

    socket.on('leave:status-updated', handleLeaveUpdated)

    return () => {
      socket.off('leave:status-updated', handleLeaveUpdated)
    }
  }, [queryClient]);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveApi.cancelLeave(id),
    onSuccess: () => {
      toast.success('Leave cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel leave');
    },
  });

  const handleCancel = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      cancelMutation.mutate(id);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const calculateDays = (from: string, to: string) => {
    const fDate = new Date(from);
    const tDate = new Date(to);
    return Math.ceil((tDate.getTime() - fDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-teal-400 animate-spin" />
          <p className="text-slate-400">Loading your leaves...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto mb-8 flex justify-between items-start"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Leave Requests</h1>
          <p className="text-slate-400">Track and manage your leave applications</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/leaves')}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg hover:from-teal-600 hover:to-blue-600 transition flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          New Leave
        </motion.button>
      </motion.div>

      {/* Content */}
      {!leaves || leaves.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-6xl mx-auto text-center py-16"
        >
          <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-400 mb-2">No leave requests yet</h2>
          <p className="text-slate-500 mb-6">Start by applying for a leave request</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/leaves')}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg hover:from-teal-600 hover:to-blue-600 transition"
          >
            Apply Now
          </motion.button>
        </motion.div>
      ) : (
        <motion.div layout className="max-w-6xl mx-auto space-y-4">
          {leaves.map((leave: Leave, index: number) => {
            const config = statusConfig[leave.status as keyof typeof statusConfig];
            const StatusIcon = config?.icon || AlertCircle;
            const days = calculateDays(leave.fromDate, leave.toDate);
            const isPending = leave.status === 'PENDING';

            return (
              <motion.div
                key={leave.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setExpandedId(expandedId === leave.id ? null : leave.id)}
                className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg p-4 cursor-pointer hover:border-slate-600 transition group"
              >
                {/* Summary Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Status Badge */}
                    <div
                      className={`px-3 py-1 rounded-full flex items-center gap-2 ${config?.color || 'bg-gray-500/20 text-gray-400'}`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{config?.label}</span>
                    </div>

                    {/* Leave Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs font-medium`}>
                          {leave.leaveType}
                        </span>
                        <span className="text-slate-400 text-sm">{days} days</span>
                      </div>
                      <p className="text-white text-sm">
                        {formatDate(leave.fromDate)} → {formatDate(leave.toDate)}
                      </p>
                    </div>

                    {/* Destination */}
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{leave.destination}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {isPending && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(leave.id);
                      }}
                      disabled={cancelMutation.isPending}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedId === leave.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-slate-700/50 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Reason</p>
                        <p className="text-sm text-slate-300">{leave.reason}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Destination</p>
                        <p className="text-sm text-slate-300">{leave.destination}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Your Contact</p>
                        <p className="text-sm text-slate-300">{leave.contactNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Parent Contact</p>
                        <p className="text-sm text-slate-300">{leave.parentContact}</p>
                      </div>
                    </div>

                    {/* Remarks */}
                    {leave.wardenRemark && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                        <p className="text-xs text-blue-400 font-semibold mb-1">Warden's Remark</p>
                        <p className="text-sm text-blue-300">{leave.wardenRemark}</p>
                      </div>
                    )}

                    {leave.adminRemark && (
                      <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
                        <p className="text-xs text-purple-400 font-semibold mb-1">Admin's Remark</p>
                        <p className="text-sm text-purple-300">{leave.adminRemark}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-slate-500">
                        Applied on {new Date(leave.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
