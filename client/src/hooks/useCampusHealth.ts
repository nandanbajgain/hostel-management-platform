import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import type {
  DoctorProfile,
  HealthAppointment,
  InsuranceClaim,
  MedicalLeaveRequest,
  Medicine,
  Prescription,
} from '@/types'

export function useDoctors() {
  return useQuery<DoctorProfile[]>({
    queryKey: ['health-doctors'],
    queryFn: async () => {
      const res = await api.get('/campus-health/doctors')
      return res.data
    },
  })
}

export function useAvailableSlots(doctorId: string | null, from: string | null, to: string | null) {
  return useQuery<string[]>({
    queryKey: ['health-slots', doctorId, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ doctorId: doctorId!, from: from!, to: to! })
      const res = await api.get(`/campus-health/slots?${params.toString()}`)
      return res.data
    },
    enabled: !!doctorId && !!from && !!to,
  })
}

export function useCreateHealthAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { doctorId: string; scheduledAt: string; reason?: string }) => {
      const res = await api.post('/campus-health/appointments', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health-appointments-mine'] })
    },
  })
}

export function useMyHealthAppointments() {
  return useQuery<HealthAppointment[]>({
    queryKey: ['health-appointments-mine'],
    queryFn: async () => {
      const res = await api.get('/campus-health/appointments/mine')
      return res.data
    },
  })
}

export function useDoctorHealthAppointments() {
  return useQuery<HealthAppointment[]>({
    queryKey: ['health-appointments-doctor'],
    queryFn: async () => {
      const res = await api.get('/campus-health/appointments/doctor')
      return res.data
    },
  })
}

export function useUpdateHealthAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/campus-health/appointments/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health-appointments-mine'] })
      qc.invalidateQueries({ queryKey: ['health-appointments-doctor'] })
    },
  })
}

export function useUpsertVisitRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ appointmentId, data }: { appointmentId: string; data: any }) => {
      const res = await api.post(`/campus-health/appointments/${appointmentId}/record`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health-appointments-doctor'] })
    },
  })
}

export function useMedicines() {
  return useQuery<Medicine[]>({
    queryKey: ['health-medicines'],
    queryFn: async () => {
      const res = await api.get('/campus-health/medicines')
      return res.data
    },
  })
}

export function useCreateMedicine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/campus-health/medicines', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health-medicines'] }),
  })
}

export function useUpdateMedicine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/campus-health/medicines/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health-medicines'] }),
  })
}

export function useMyPrescriptions() {
  return useQuery<Prescription[]>({
    queryKey: ['health-prescriptions-mine'],
    queryFn: async () => {
      const res = await api.get('/campus-health/prescriptions/mine')
      return res.data
    },
  })
}

export function useDispensePrescription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/campus-health/prescriptions/${id}/dispense`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health-medicines'] })
      qc.invalidateQueries({ queryKey: ['health-appointments-doctor'] })
      qc.invalidateQueries({ queryKey: ['health-prescriptions-mine'] })
    },
  })
}

export function useCreateClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/campus-health/claims', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health-claims-mine'] }),
  })
}

export function useMyClaims() {
  return useQuery<InsuranceClaim[]>({
    queryKey: ['health-claims-mine'],
    queryFn: async () => {
      const res = await api.get('/campus-health/claims/mine')
      return res.data
    },
  })
}

export function useAllClaims() {
  return useQuery<InsuranceClaim[]>({
    queryKey: ['health-claims'],
    queryFn: async () => {
      const res = await api.get('/campus-health/claims')
      return res.data
    },
  })
}

export function useUpdateClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/campus-health/claims/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health-claims'] }),
  })
}

export function useCreateMedicalLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/campus-health/medical-leave', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health-medical-leave-mine'] }),
  })
}

export function useMyMedicalLeave() {
  return useQuery<MedicalLeaveRequest[]>({
    queryKey: ['health-medical-leave-mine'],
    queryFn: async () => {
      const res = await api.get('/campus-health/medical-leave/mine')
      return res.data
    },
  })
}

export function useAllMedicalLeave() {
  return useQuery<MedicalLeaveRequest[]>({
    queryKey: ['health-medical-leave'],
    queryFn: async () => {
      const res = await api.get('/campus-health/medical-leave')
      return res.data
    },
  })
}

export function useUpdateMedicalLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/campus-health/medical-leave/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health-medical-leave'] }),
  })
}

export function useMyDoctorAvailability() {
  return useQuery<any[]>({
    queryKey: ['health-doctor-availability'],
    queryFn: async () => {
      const res = await api.get('/campus-health/doctor/availability')
      return res.data
    },
  })
}

export function useReplaceDoctorAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (items: any[]) => {
      const res = await api.post('/campus-health/doctor/availability', items)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health-doctor-availability'] }),
  })
}

