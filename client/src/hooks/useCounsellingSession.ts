import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useCounsellingSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['counselling-session', sessionId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/counselling/sessions/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
  });
}

export function useMySessionS() {
  return useQuery({
    queryKey: ['my-counselling-sessions'],
    queryFn: async () => {
      const response = await api.get('/api/v1/counselling/sessions/mine');
      return response.data;
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/api/v1/counselling/sessions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-counselling-sessions'] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: any }) => {
      const response = await api.post(`/api/v1/counselling/sessions/${sessionId}/messages`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['counselling-session', variables.sessionId],
      });
    },
  });
}

export function useCloseSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: any }) => {
      const response = await api.post(`/api/v1/counselling/sessions/${sessionId}/close`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counselling-session'] });
      queryClient.invalidateQueries({ queryKey: ['my-counselling-sessions'] });
    },
  });
}

export function useRateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: any }) => {
      const response = await api.post(`/api/v1/counselling/sessions/${sessionId}/rate`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counselling-session'] });
    },
  });
}

export function useCounsellorDashboard(filters?: any) {
  return useQuery({
    queryKey: ['counsellor-dashboard', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit);
      if (filters?.offset) params.append('offset', filters.offset);

      const response = await api.get(`/api/v1/counselling/dashboard?${params.toString()}`);
      return response.data;
    },
  });
}

export function useStudentProfile(studentId: string | null) {
  return useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/counselling/student/${studentId}/profile`);
      return response.data;
    },
    enabled: !!studentId,
  });
}

export function useCounsellorProfile() {
  return useQuery({
    queryKey: ['counsellor-profile'],
    queryFn: async () => {
      const response = await api.get('/api/v1/counselling/profile');
      return response.data;
    },
  });
}

export function useUpdateCounsellorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/api/v1/counselling/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counsellor-profile'] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const response = await api.get('/api/v1/counselling/unread');
      return response.data.count;
    },
  });
}

export function useCounsellorStats() {
  return useQuery({
    queryKey: ['counsellor-stats'],
    queryFn: async () => {
      const response = await api.get('/api/v1/counselling/stats');
      return response.data;
    },
  });
}
