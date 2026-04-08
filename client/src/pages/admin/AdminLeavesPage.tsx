import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast'
import {
  Check,
  X,
  BarChart3,
  MapPin,
  User,
  Phone,
  FileText,
  Loader,
  ChevronDown,
} from 'lucide-react';
import { leaveApi } from '../../services/leave';

interface Leave {
  id: string;
  leaveType: string;
  reason: string;
  fromDate: string;
  toDate: string;
  destination: string;
  student: { id: string; name: string; email: string; enrollmentNo: string };
  status: string;
  wardenRemark?: string;
  createdAt: string;
}

export default function AdminLeavesPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [filter, setFilter] = useState('APPROVED_BY_WARDEN');

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { remark: '' },
  });

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['allLeavesAdmin', filter],
    queryFn: () =>
      leaveApi.getAllLeaves({ status: filter || undefined }).then((res: any) => res.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['leaveStats'],
    queryFn: () => leaveApi.getStatistics().then((res: any) => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      leaveApi.updateLeaveStatus(selectedId || '', {
        status: actionType === 'approve' ? 'APPROVED' : 'REJECTED',
        remark: data.remark,
      }),
    onSuccess: () => {
      toast.success(
        `Leave ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`,
      );
      queryClient.invalidateQueries({ queryKey: ['allLeavesAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['leaveStats'] });
      setSelectedId(null);
      setActionType(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update leave');
    },
  });

  const handleAction = (id: string, type: 'approve' | 'reject') => {
    setSelectedId(id);
    setActionType(type);
  };

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
          <p className="text-slate-400">Loading leaves...</p>
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
        className="max-w-6xl mx-auto mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Leave Management Dashboard</h1>
        <p className="text-slate-400">Review and approve final leave requests</p>
      </motion.div>

      {/* Statistics */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto mb-8 grid grid-cols-2 md:grid-cols-6 gap-3"
        >
          {[
            { label: 'Total', value: stats.total, color: 'from-blue-500 to-cyan-500' },
            { label: 'Pending', value: stats.pending, color: 'from-yellow-500 to-orange-500' },
            {
              label: 'By Warden',
              value: stats.approvedByWarden,
              color: 'from-purple-500 to-pink-500',
            },
            { label: 'Approved', value: stats.approved, color: 'from-emerald-500 to-teal-500' },
            { label: 'Rejected', value: stats.rejected, color: 'from-red-500 to-pink-500' },
            { label: 'Cancelled', value: stats.cancelled, color: 'from-gray-500 to-slate-500' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-gradient-to-br ${stat.color} p-4 rounded-lg shadow-lg`}
            >
              <p className="text-white/80 text-xs font-semibold mb-1">{stat.label}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto mb-6 flex gap-3"
      >
        {[
          { val: 'APPROVED_BY_WARDEN', label: 'Warden Approved' },
          { val: 'APPROVED', label: 'Final Approved' },
          { val: 'REJECTED', label: 'Rejected' },
        ].map((f) => (
          <motion.button
            key={f.val}
            whileHover={{ scale: 1.05 }}
            onClick={() => setFilter(f.val)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f.val
                ? 'bg-teal-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {f.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Leave Cards */}
      <motion.div layout className="max-w-6xl mx-auto space-y-4">
        {!leaves || leaves.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No leaves in this category</p>
          </motion.div>
        ) : (
          leaves.map((leave: Leave, index: number) => (
            <motion.div
              key={leave.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg p-4 hover:border-slate-600 transition"
            >
              <div
                onClick={() => setExpandedId(expandedId === leave.id ? null : leave.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="inline-block px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-xs font-semibold">
                      {leave.leaveType}
                    </span>
                    <div>
                      <p className="text-white font-semibold">{leave.student.name}</p>
                      <p className="text-slate-400 text-sm">{leave.student.enrollmentNo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300 text-sm">
                      {calculateDays(leave.fromDate, leave.toDate)} days
                    </p>
                    <p className="text-slate-400 text-xs">
                      {formatDate(leave.fromDate)} to {formatDate(leave.toDate)}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition ${
                      expandedId === leave.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedId === leave.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-4 border-t border-slate-700/50"
                    >
                      {/* Reason */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <p className="text-xs text-slate-400 font-semibold">Reason</p>
                        </div>
                        <p className="text-slate-300 ml-6">{leave.reason}</p>
                      </div>

                      {/* Destination */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <p className="text-xs text-slate-400 font-semibold">Destination</p>
                        </div>
                        <p className="text-slate-300 ml-6">{leave.destination}</p>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <p className="text-xs text-slate-400 font-semibold">Email</p>
                          </div>
                          <p className="text-slate-300 ml-6 text-sm">{leave.student?.email}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-slate-400" />
                            <p className="text-xs text-slate-400 font-semibold">
                              Applied on
                            </p>
                          </div>
                          <p className="text-slate-300 ml-6 text-sm">
                            {formatDate(leave.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Warden Remark */}
                      {leave.wardenRemark && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                          <p className="text-xs text-blue-400 font-semibold mb-1">
                            Warden's Comment
                          </p>
                          <p className="text-sm text-blue-200">{leave.wardenRemark}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {leave.status === 'APPROVED_BY_WARDEN' && (
                        <div className="flex gap-3 pt-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleAction(leave.id, 'approve')}
                            className="flex-1 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition flex items-center justify-center gap-2 font-medium"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleAction(leave.id, 'reject')}
                            className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition flex items-center justify-center gap-2 font-medium"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Action Modal */}
      <AnimatePresence>
        {selectedId && actionType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-bold text-white mb-4">
                {actionType === 'approve' ? 'Approve Leave' : 'Reject Leave'}
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Admin Remark (optional)
                  </label>
                  <Controller
                    name="remark"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        placeholder="Add a comment for the student..."
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none resize-none h-20"
                      />
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition font-medium"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    type="submit"
                    disabled={updateMutation.isPending}
                    className={`flex-1 px-4 py-2 rounded-lg transition font-medium disabled:opacity-50 ${
                      actionType === 'approve'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {updateMutation.isPending ? 'Processing...' : 'Confirm'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
