import api from './api';

export const leaveApi = {
  // Apply for leave
  applyLeave: (data: {
    leaveType: string;
    reason: string;
    fromDate: string;
    toDate: string;
    destination: string;
    contactNumber: string;
    parentContact: string;
  }) => api.post('/leaves', data),

  // Get my leaves (student)
  getMyLeaves: () => api.get('/leaves/mine'),

  // Get all leaves (warden/admin)
  getAllLeaves: (filters?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    return api.get(`/leaves?${params.toString()}`);
  },

  // Get leave by ID
  getLeaveById: (id: string) => api.get(`/leaves/${id}`),

  // Update leave status (warden/admin)
  updateLeaveStatus: (id: string, data: { status: string; remark?: string }) =>
    api.patch(`/leaves/${id}/status`, data),

  // Cancel leave (student)
  cancelLeave: (id: string) => api.delete(`/leaves/${id}/cancel`),

  // Get statistics (admin)
  getStatistics: () => api.get('/leaves/statistics'),
};
