import { useMemo, useState } from 'react'
import { Calendar, ClipboardList, FileText, HeartPulse, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useAvailableSlots,
  useCreateClaim,
  useCreateHealthAppointment,
  useCreateMedicalLeave,
  useDoctors,
  useMyClaims,
  useMyHealthAppointments,
  useMyMedicalLeave,
  useMyPrescriptions,
} from '@/hooks/useCampusHealth'

const tabs = [
  { id: 'book', label: 'Book', icon: Calendar },
  { id: 'appointments', label: 'Appointments', icon: ClipboardList },
  { id: 'prescriptions', label: 'Prescriptions', icon: HeartPulse },
  { id: 'insurance', label: 'Insurance', icon: ShieldCheck },
  { id: 'medical', label: 'Medical Leave', icon: FileText },
] as const

export default function CampusHealthStudentPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('book')
  const { data: doctors = [] } = useDoctors()
  const [doctorId, setDoctorId] = useState<string>('')
  const [reason, setReason] = useState('')

  const [slotFromDays, setSlotFromDays] = useState(0)
  const range = useMemo(() => {
    const from = new Date()
    from.setDate(from.getDate() + slotFromDays)
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 7)
    to.setHours(23, 59, 0, 0)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [slotFromDays])

  const { data: slots = [] } = useAvailableSlots(doctorId || null, range.from, range.to)
  const createAppointment = useCreateHealthAppointment()
  const { data: myAppointments = [] } = useMyHealthAppointments()
  const { data: myPrescriptions = [] } = useMyPrescriptions()
  const createClaim = useCreateClaim()
  const { data: myClaims = [] } = useMyClaims()
  const createMedicalLeave = useCreateMedicalLeave()
  const { data: myMedicalLeave = [] } = useMyMedicalLeave()

  const [claimAmount, setClaimAmount] = useState('')
  const [claimDesc, setClaimDesc] = useState('')
  const [claimBillUrl, setClaimBillUrl] = useState('')
  const [leaveFrom, setLeaveFrom] = useState('')
  const [leaveTo, setLeaveTo] = useState('')
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveDocUrl, setLeaveDocUrl] = useState('')

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Campus Health</h1>
          <p className="text-gray-600 mt-1">
            Appointments, records, prescriptions, and insurance—centralized for students.
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white/85 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm p-2 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              tab === t.id ? 'bg-gray-900 text-white' : 'text-gray-800 hover:bg-gray-100'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'book' ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900">Book an appointment</h2>
            <p className="text-sm text-gray-600 mt-1">Pick a doctor and a slot from their availability.</p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Doctor</label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-300"
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.user?.name} {d.specialization ? `• ${d.specialization}` : ''}
                    </option>
                  ))}
                </select>
                {doctorId ? (
                  <p className="text-xs text-gray-500 mt-2">
                    {doctors.find((d) => d.id === doctorId)?.availabilityNote || 'Availability not set'}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Reason (optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="e.g., fever, headache, stress…"
                  className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-300"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-600">Slots window</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSlotFromDays((v) => Math.max(0, v - 7))}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotFromDays((v) => v + 7)}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900">Available slots</h2>
            <p className="text-sm text-gray-600 mt-1">Click a slot to request booking.</p>

            <div className="mt-4 space-y-2 max-h-[480px] overflow-y-auto pr-2">
              {doctorId ? (
                slots.length ? (
                  slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={async () => {
                        try {
                          await createAppointment.mutateAsync({
                            doctorId,
                            scheduledAt: s,
                            reason: reason.trim() || undefined,
                          })
                          toast.success('Appointment requested')
                          setTab('appointments')
                        } catch (e: any) {
                          toast.error(e?.response?.data?.message || 'Failed to book slot')
                        }
                      }}
                      disabled={createAppointment.isPending}
                      className="w-full text-left px-4 py-3 rounded-2xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all flex items-center justify-between"
                    >
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(s).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-600">Request</span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No slots available in this window.</p>
                )
              ) : (
                <p className="text-sm text-gray-500">Select a doctor to see slots.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'appointments' ? (
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900">My appointments</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAppointments.length ? (
              myAppointments.map((a) => (
                <div key={a.id} className="border border-gray-200 rounded-2xl p-4 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{a.doctor?.user?.name || 'Doctor'}</p>
                      <p className="text-sm text-gray-600 mt-1">{new Date(a.scheduledAt).toLocaleString()}</p>
                      {a.reason ? <p className="text-sm text-gray-600 mt-2 line-clamp-3">{a.reason}</p> : null}
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200 flex-shrink-0">
                      {a.status}
                    </span>
                  </div>
                  {a.record?.diagnosis ? (
                    <div className="mt-3 text-sm text-gray-700">
                      <span className="font-semibold">Diagnosis:</span> {a.record.diagnosis}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No appointments yet.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'prescriptions' ? (
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900">Prescriptions</h2>
          <div className="mt-4 space-y-4">
            {myPrescriptions.length ? (
              myPrescriptions.map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-2xl p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">Prescription</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                      {p.status}
                    </span>
                  </div>
                  {p.notes ? <p className="text-sm text-gray-600 mt-2">{p.notes}</p> : null}
                  <div className="mt-3 space-y-2">
                    {(p.items || []).map((it) => (
                      <div key={it.id} className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{it.medicineName}</p>
                          <p className="text-gray-600">
                            {[it.dosage, it.frequency, it.durationDays ? `${it.durationDays} days` : null]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        </div>
                        {it.quantity ? <span className="text-gray-700">x{it.quantity}</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No prescriptions yet.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'insurance' ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900">Submit insurance claim</h2>
            <p className="text-sm text-gray-600 mt-1">Admin will review and process your reimbursement.</p>

            <div className="mt-4 space-y-3">
              <input
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="Amount (e.g., 1200)"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
              />
              <textarea
                value={claimDesc}
                onChange={(e) => setClaimDesc(e.target.value)}
                rows={4}
                placeholder="Description (optional)"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
              />
              <input
                value={claimBillUrl}
                onChange={(e) => setClaimBillUrl(e.target.value)}
                placeholder="Bill URL (optional)"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await createClaim.mutateAsync({
                      amount: claimAmount ? Number(claimAmount) : undefined,
                      description: claimDesc || undefined,
                      billUrl: claimBillUrl || undefined,
                    })
                    toast.success('Claim submitted')
                    setClaimAmount('')
                    setClaimDesc('')
                    setClaimBillUrl('')
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || 'Failed to submit claim')
                  }
                }}
                disabled={createClaim.isPending}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-full transition-all"
              >
                {createClaim.isPending ? 'Submitting…' : 'Submit claim'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900">My claims</h2>
            <div className="mt-4 space-y-3">
              {myClaims.length ? (
                myClaims.map((c) => (
                  <div key={c.id} className="border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900">{c.amount ? `₹${c.amount}` : 'Claim'}</p>
                      <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                        {c.status}
                      </span>
                    </div>
                    {c.description ? <p className="text-sm text-gray-600 mt-2">{c.description}</p> : null}
                    {c.adminNote ? <p className="text-sm text-gray-700 mt-2"><span className="font-semibold">Admin:</span> {c.adminNote}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No claims yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'medical' ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900">Medical leave request</h2>
            <p className="text-sm text-gray-600 mt-1">Submit documents for admin verification.</p>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={leaveFrom}
                  onChange={(e) => setLeaveFrom(e.target.value)}
                  className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900"
                />
                <input
                  type="date"
                  value={leaveTo}
                  onChange={(e) => setLeaveTo(e.target.value)}
                  className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900"
                />
              </div>
              <textarea
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                rows={4}
                placeholder="Reason"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
              />
              <input
                value={leaveDocUrl}
                onChange={(e) => setLeaveDocUrl(e.target.value)}
                placeholder="Document URL (optional)"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await createMedicalLeave.mutateAsync({
                      fromDate: new Date(leaveFrom).toISOString(),
                      toDate: new Date(leaveTo).toISOString(),
                      reason: leaveReason,
                      documentUrl: leaveDocUrl || undefined,
                    })
                    toast.success('Medical leave submitted')
                    setLeaveFrom('')
                    setLeaveTo('')
                    setLeaveReason('')
                    setLeaveDocUrl('')
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || 'Failed to submit request')
                  }
                }}
                disabled={createMedicalLeave.isPending}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-full transition-all"
              >
                {createMedicalLeave.isPending ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900">My requests</h2>
            <div className="mt-4 space-y-3">
              {myMedicalLeave.length ? (
                myMedicalLeave.map((r) => (
                  <div key={r.id} className="border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900">
                        {new Date(r.fromDate).toLocaleDateString()} → {new Date(r.toDate).toLocaleDateString()}
                      </p>
                      <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                        {r.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{r.reason}</p>
                    {r.adminNote ? (
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-semibold">Admin:</span> {r.adminNote}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No medical leave requests yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

