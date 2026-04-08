import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast'
import {
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Calendar,
  MapPin,
  Phone,
  FileText,
} from 'lucide-react';
import { leaveApi } from '../../services/leave';

const leaveSchema = z
  .object({
    leaveType: z.enum(['HOME', 'MEDICAL', 'PERSONAL', 'EMERGENCY', 'OTHER']),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
    fromDate: z.string(),
    toDate: z.string(),
    destination: z.string().min(3, 'Enter valid destination'),
    contactNumber: z.string().regex(/^\d{10}$/, 'Contact must be 10 digits'),
    parentContact: z.string().regex(/^\d{10}$/, 'Parent contact must be 10 digits'),
  })
  .refine((data) => new Date(data.toDate) > new Date(data.fromDate), {
    message: 'End date must be after start date',
    path: ['toDate'],
  });

type LeaveFormValues = z.infer<typeof leaveSchema>;

export default function LeaveApplicationPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leaveType: 'HOME',
      reason: '',
      fromDate: '',
      toDate: '',
      destination: '',
      contactNumber: '',
      parentContact: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: LeaveFormValues) => leaveApi.applyLeave(data),
    onSuccess: () => {
      toast.success('Leave application submitted successfully!');
      setSubmitted(true);
      reset();
      setTimeout(() => setSubmitted(false), 3000);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to apply for leave');
    },
  });

  const onSubmit = (data: LeaveFormValues) => {
    mutation.mutate(data);
  };

  const fromDate = watch('fromDate');
  const toDate = watch('toDate');

  const calculateDays = () => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const days = calculateDays();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Apply for Leave</h1>
        <p className="text-slate-400">Submit your leave request through this form</p>
      </motion.div>

      {/* Success Message */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="max-w-2xl mx-auto mb-6 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-300">Application submitted! Check your history.</span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Card Container */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-xl">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Leave Type</label>
              <Controller
                name="leaveType"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-teal-500 focus:outline-none transition"
                  >
                    <option value="HOME">Home</option>
                    <option value="MEDICAL">Medical</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="OTHER">Other</option>
                  </select>
                )}
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reason for Leave
              </label>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <div>
                    <textarea
                      {...field}
                      placeholder="Explain the reason for your leave request..."
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none transition resize-none h-24"
                    />
                    {errors.reason && (
                      <div className="flex items-center gap-2 mt-1 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.reason.message}
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  From Date
                </label>
                <Controller
                  name="fromDate"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-teal-500 focus:outline-none transition"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  To Date
                </label>
                <Controller
                  name="toDate"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <input
                        {...field}
                        type="date"
                        min={fromDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-teal-500 focus:outline-none transition"
                      />
                      {errors.toDate && (
                        <div className="flex items-center gap-2 mt-1 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          {errors.toDate.message}
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Duration Info */}
            {days > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg"
              >
                <p className="text-teal-300 text-sm">
                  <span className="font-semibold">{days}</span> day{days !== 1 ? 's' : ''} leave
                  {days > 30 && <span className="ml-2 text-red-400">⚠️ Exceeds 30-day limit</span>}
                </p>
              </motion.div>
            )}

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Destination
              </label>
              <Controller
                name="destination"
                control={control}
                render={({ field }) => (
                  <div>
                    <input
                      {...field}
                      placeholder="Where will you be during leave?"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none transition"
                    />
                    {errors.destination && (
                      <div className="flex items-center gap-2 mt-1 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.destination.message}
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Contact Numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Your Contact
                </label>
                <Controller
                  name="contactNumber"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <input
                        {...field}
                        placeholder="10-digit number"
                        maxLength={10}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none transition"
                      />
                      {errors.contactNumber && (
                        <div className="flex items-center gap-2 mt-1 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          {errors.contactNumber.message}
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Parent Contact
                </label>
                <Controller
                  name="parentContact"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <input
                        {...field}
                        placeholder="Parent's phone"
                        maxLength={10}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none transition"
                      />
                      {errors.parentContact && (
                        <div className="flex items-center gap-2 mt-1 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          {errors.parentContact.message}
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={mutation.isPending}
            className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Application
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
