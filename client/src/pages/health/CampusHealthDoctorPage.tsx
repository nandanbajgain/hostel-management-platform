import { useEffect, useMemo, useState } from 'react'
import { Calendar, ClipboardSignature, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useDoctorHealthAppointments,
  useMyDoctorAvailability,
  useReplaceDoctorAvailability,
  useUpsertVisitRecord,
  useMedicines,
} from '@/hooks/useCampusHealth'

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function minsToTime(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function timeToMins(value: string) {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

export default function CampusHealthDoctorPage() {
  const [tab, setTab] = useState<'appointments' | 'availability' | 'records'>('appointments')
  const { data: appointments = [] } = useDoctorHealthAppointments()
  const { data: avail = [] } = useMyDoctorAvailability()
  const replaceAvail = useReplaceDoctorAvailability()
  const upsertRecord = useUpsertVisitRecord()
  const { data: medicines = [] } = useMedicines()

  type AvailabilityBlock = {
    dayOfWeek: number
    startMinute: number
    endMinute: number
    slotDurationMins: number
    isActive: boolean
  }

  const availabilityByDay = useMemo(() => {
    const grouped: Record<number, AvailabilityBlock[]> = {}
    for (const a of avail) {
      grouped[a.dayOfWeek] = grouped[a.dayOfWeek] || []
      grouped[a.dayOfWeek].push(a as AvailabilityBlock)
    }
    return grouped
  }, [avail])

  const [availabilityDraft, setAvailabilityDraft] = useState<Record<number, AvailabilityBlock>>({})

  useEffect(() => {
    const next: Record<number, AvailabilityBlock> = {}
    for (let day = 0; day < 7; day += 1) {
      const block = (availabilityByDay[day] || [])[0]
      next[day] = block || {
        dayOfWeek: day,
        startMinute: 10 * 60,
        endMinute: 16 * 60,
        slotDurationMins: 30,
        isActive: day >= 1 && day <= 5,
      }
    }
    setAvailabilityDraft(next)
  }, [availabilityByDay])

  const [recordDraft, setRecordDraft] = useState<any>({
    appointmentId: '',
    symptoms: '',
    diagnosis: '',
    treatmentPlan: '',
    doctorNotes: '',
    prescriptionItems: [{ medicineName: '', medicineId: '', dosage: '', frequency: '', durationDays: 5, quantity: 1 }],
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Campus Health • Doctor</h1>
          <p className="text-gray-600 mt-1">Manage appointments, availability, and visit records.</p>
        </div>
      </div>

      <div className="mt-6 bg-white/85 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setTab('appointments')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            tab === 'appointments' ? 'bg-gray-900 text-white' : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-4 h-4" /> Appointments
        </button>
        <button
          onClick={() => setTab('records')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            tab === 'records' ? 'bg-gray-900 text-white' : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          <ClipboardSignature className="w-4 h-4" /> Records
        </button>
        <button
          onClick={() => setTab('availability')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            tab === 'availability' ? 'bg-gray-900 text-white' : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Settings className="w-4 h-4" /> Availability
        </button>
      </div>

      {tab === 'appointments' ? (
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900">Upcoming</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.length ? (
              appointments.map((a) => (
                <div key={a.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{a.student?.name || 'Student'}</p>
                      <p className="text-sm text-gray-600 mt-1">{new Date(a.scheduledAt).toLocaleString()}</p>
                      {a.reason ? <p className="text-sm text-gray-700 mt-2 line-clamp-3">{a.reason}</p> : null}
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                      {a.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mt-3 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl transition-all"
                    onClick={() => {
                      setRecordDraft((d: any) => ({
                        ...d,
                        appointmentId: a.id,
                        symptoms: a.record?.symptoms || '',
                        diagnosis: a.record?.diagnosis || '',
                        treatmentPlan: a.record?.treatmentPlan || '',
                        doctorNotes: a.record?.doctorNotes || '',
                        prescriptionItems:
                          a.record?.prescription?.items?.length
                            ? a.record.prescription.items.map((it: any) => ({
                                medicineName: it.medicineName,
                                medicineId: it.medicineId || '',
                                dosage: it.dosage || '',
                                frequency: it.frequency || '',
                                durationDays: it.durationDays || 5,
                                quantity: it.quantity || 1,
                              }))
                            : [{ medicineName: '', medicineId: '', dosage: '', frequency: '', durationDays: 5, quantity: 1 }],
                      }))
                      setTab('records')
                    }}
                  >
                    Open record
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No appointments.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'records' ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900">Visit record</h2>
            <p className="text-sm text-gray-600 mt-1">Fill details and issue prescription.</p>

            <div className="mt-4 space-y-3">
              <input
                value={recordDraft.appointmentId}
                onChange={(e) => setRecordDraft((d: any) => ({ ...d, appointmentId: e.target.value }))}
                placeholder="Appointment ID"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
              />
              <textarea
                value={recordDraft.symptoms}
                onChange={(e) => setRecordDraft((d: any) => ({ ...d, symptoms: e.target.value }))}
                rows={3}
                placeholder="Symptoms"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
              />
              <textarea
                value={recordDraft.diagnosis}
                onChange={(e) => setRecordDraft((d: any) => ({ ...d, diagnosis: e.target.value }))}
                rows={3}
                placeholder="Diagnosis"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
              />
              <textarea
                value={recordDraft.treatmentPlan}
                onChange={(e) => setRecordDraft((d: any) => ({ ...d, treatmentPlan: e.target.value }))}
                rows={3}
                placeholder="Treatment plan"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
              />
              <textarea
                value={recordDraft.doctorNotes}
                onChange={(e) => setRecordDraft((d: any) => ({ ...d, doctorNotes: e.target.value }))}
                rows={3}
                placeholder="Doctor notes"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900">Prescription</h2>
            <div className="mt-4 space-y-3">
              {recordDraft.prescriptionItems.map((it: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-2xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={it.medicineId}
                      onChange={(e) => {
                        const med = medicines.find((m: any) => m.id === e.target.value)
                        setRecordDraft((d: any) => {
                          const next = [...d.prescriptionItems]
                          next[idx] = { ...next[idx], medicineId: e.target.value, medicineName: med?.name || it.medicineName }
                          return { ...d, prescriptionItems: next }
                        })
                      }}
                      className="w-full bg-white px-3 py-2 border border-gray-300 rounded-xl text-gray-900"
                    >
                      <option value="">Select medicine (optional)</option>
                      {medicines.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.stockQty})
                        </option>
                      ))}
                    </select>
                    <input
                      value={it.medicineName}
                      onChange={(e) => {
                        setRecordDraft((d: any) => {
                          const next = [...d.prescriptionItems]
                          next[idx] = { ...next[idx], medicineName: e.target.value }
                          return { ...d, prescriptionItems: next }
                        })
                      }}
                      placeholder="Medicine name"
                      className="w-full bg-white px-3 py-2 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500"
                    />
                    <input
                      value={it.dosage}
                      onChange={(e) => {
                        setRecordDraft((d: any) => {
                          const next = [...d.prescriptionItems]
                          next[idx] = { ...next[idx], dosage: e.target.value }
                          return { ...d, prescriptionItems: next }
                        })
                      }}
                      placeholder="Dosage"
                      className="w-full bg-white px-3 py-2 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500"
                    />
                    <input
                      value={it.frequency}
                      onChange={(e) => {
                        setRecordDraft((d: any) => {
                          const next = [...d.prescriptionItems]
                          next[idx] = { ...next[idx], frequency: e.target.value }
                          return { ...d, prescriptionItems: next }
                        })
                      }}
                      placeholder="Frequency"
                      className="w-full bg-white px-3 py-2 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500"
                    />
                    <input
                      type="number"
                      value={it.durationDays}
                      onChange={(e) => {
                        setRecordDraft((d: any) => {
                          const next = [...d.prescriptionItems]
                          next[idx] = { ...next[idx], durationDays: Number(e.target.value) }
                          return { ...d, prescriptionItems: next }
                        })
                      }}
                      placeholder="Days"
                      className="w-full bg-white px-3 py-2 border border-gray-300 rounded-xl text-gray-900"
                    />
                    <input
                      type="number"
                      value={it.quantity}
                      onChange={(e) => {
                        setRecordDraft((d: any) => {
                          const next = [...d.prescriptionItems]
                          next[idx] = { ...next[idx], quantity: Number(e.target.value) }
                          return { ...d, prescriptionItems: next }
                        })
                      }}
                      placeholder="Quantity"
                      className="w-full bg-white px-3 py-2 border border-gray-300 rounded-xl text-gray-900"
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setRecordDraft((d: any) => ({
                      ...d,
                      prescriptionItems: [...d.prescriptionItems, { medicineName: '', medicineId: '', dosage: '', frequency: '', durationDays: 5, quantity: 1 }],
                    }))
                  }
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold"
                >
                  Add item
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await upsertRecord.mutateAsync({
                        appointmentId: recordDraft.appointmentId,
                        data: {
                          symptoms: recordDraft.symptoms,
                          diagnosis: recordDraft.diagnosis,
                          treatmentPlan: recordDraft.treatmentPlan,
                          doctorNotes: recordDraft.doctorNotes,
                          prescriptionItems: recordDraft.prescriptionItems.filter((x: any) => x.medicineName.trim()),
                        },
                      })
                      toast.success('Record saved')
                    } catch (e: any) {
                      toast.error(e?.response?.data?.message || 'Failed to save')
                    }
                  }}
                  disabled={!recordDraft.appointmentId || upsertRecord.isPending}
                  className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-2 rounded-xl transition-all"
                >
                  {upsertRecord.isPending ? 'Saving…' : 'Save record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'availability' ? (
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900">Weekly availability</h2>
          <p className="text-sm text-gray-600 mt-1">Set one block per day (MVP). Times are local.</p>

          <div className="mt-4 space-y-3">
            {days.map((label, dayOfWeek) => {
              const block = availabilityDraft[dayOfWeek]
              if (!block) return null
              const start = minsToTime(block.startMinute)
              const end = minsToTime(block.endMinute)

              return (
                <div key={label} className="border border-gray-200 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
                  <div className="w-14 font-bold text-gray-900">{label}</div>
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={block.isActive}
                      onChange={(e) => {
                        setAvailabilityDraft((prev) => ({
                          ...prev,
                          [dayOfWeek]: { ...prev[dayOfWeek], isActive: e.target.checked },
                        }))
                      }}
                    />
                    Active
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={start}
                      onChange={(e) => {
                        setAvailabilityDraft((prev) => ({
                          ...prev,
                          [dayOfWeek]: { ...prev[dayOfWeek], startMinute: timeToMins(e.target.value) },
                        }))
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-xl"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={end}
                      onChange={(e) => {
                        setAvailabilityDraft((prev) => ({
                          ...prev,
                          [dayOfWeek]: { ...prev[dayOfWeek], endMinute: timeToMins(e.target.value) },
                        }))
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await replaceAvail.mutateAsync(Object.values(availabilityDraft))
                toast.success('Availability saved')
              } catch (e: any) {
                toast.error(e?.response?.data?.message || 'Failed to save')
              }
            }}
            disabled={replaceAvail.isPending}
            className="mt-4 bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-full"
          >
            {replaceAvail.isPending ? 'Saving…' : 'Save availability'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
