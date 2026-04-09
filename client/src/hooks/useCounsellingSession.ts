import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { CounsellingAppointment, JournalEntry } from '@/types';

export function useCounsellingSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['counselling-session', sessionId],
    queryFn: async () => {
      const response = await api.get(`/counselling/sessions/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
  });
}

export function useMySessionS() {
  return useQuery({
    queryKey: ['my-counselling-sessions'],
    queryFn: async () => {
      const response = await api.get('/counselling/sessions/mine');
      return response.data;
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/counselling/sessions', data);
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
      const response = await api.post(`/counselling/sessions/${sessionId}/messages`, data);
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
      const response = await api.post(`/counselling/sessions/${sessionId}/close`, data);
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
      const response = await api.post(`/counselling/sessions/${sessionId}/rate`, data);
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

      const response = await api.get(`/counselling/dashboard?${params.toString()}`);
      return response.data;
    },
  });
}

export function useStudentProfile(studentId: string | null) {
  return useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      const response = await api.get(`/counselling/student/${studentId}/profile`);
      return response.data;
    },
    enabled: !!studentId,
  });
}

export function useCounsellorProfile() {
  return useQuery({
    queryKey: ['counsellor-profile'],
    queryFn: async () => {
      const response = await api.get('/counselling/profile');
      return response.data;
    },
  });
}

export function useUpdateCounsellorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/counselling/profile', data);
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
      const response = await api.get('/counselling/unread');
      return response.data.count;
    },
  });
}

export function useCounsellorStats() {
  return useQuery({
    queryKey: ['counsellor-stats'],
    queryFn: async () => {
      const response = await api.get('/counselling/stats');
      return response.data;
    },
  });
}

export function useSessionAppointments(sessionId: string | null) {
  return useQuery<CounsellingAppointment[]>({
    queryKey: ['counselling-appointments', sessionId],
    queryFn: async () => {
      const response = await api.get(`/counselling/sessions/${sessionId}/appointments`);
      return response.data;
    },
    enabled: !!sessionId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: any }) => {
      const response = await api.post(`/counselling/sessions/${sessionId}/appointments`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['counselling-appointments', variables.sessionId] });
    },
  });
}

export function useCounsellorAppointments() {
  return useQuery<CounsellingAppointment[]>({
    queryKey: ['counsellor-appointments'],
    queryFn: async () => {
      const response = await api.get('/counselling/appointments');
      return response.data;
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ appointmentId, data }: { appointmentId: string; data: any }) => {
      const response = await api.patch(`/counselling/appointments/${appointmentId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counsellor-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['counselling-appointments'] });
    },
  });
}

export function useMyJournalEntries() {
  return useQuery<JournalEntry[]>({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const response = await api.get('/counselling/journal');
      return response.data;
    },
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/counselling/journal', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(`/counselling/journal/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/counselling/journal/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });
}
