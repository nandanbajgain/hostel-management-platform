import { useState } from 'react'
import { BadgeCheck, FileText, Package, ShieldCheck, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useAllClaims,
  useAllMedicalLeave,
  useCreateMedicine,
  useDoctors,
  useMedicines,
  useUpdateClaim,
  useUpdateMedicalLeave,
  useUpdateMedicine,
} from '@/hooks/useCampusHealth'

export default function CampusHealthAdminPage() {
  const [tab, setTab] = useState<'claims' | 'medicines' | 'medical' | 'doctors'>('claims')
  const { data: claims = [] } = useAllClaims()
  const { data: medicines = [] } = useMedicines()
  const { data: medical = [] } = useAllMedicalLeave()
  const { data: doctors = [] } = useDoctors()
  const updateClaim = useUpdateClaim()
  const updateMedical = useUpdateMedicalLeave()
  const createMedicine = useCreateMedicine()
  const updateMedicine = useUpdateMedicine()

  const [newMedName, setNewMedName] = useState('')
  const [newMedStock, setNewMedStock] = useState('0')

  return (
    <div className="max-w-6xl mx-auto text-slate-100">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Campus Health • Admin</h1>
          <p className="text-slate-400 mt-1">Claims, medical documents, inventory, and oversight.</p>
        </div>
      </div>

      <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-sm p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setTab('claims')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            tab === 'claims'
              ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md'
              : 'text-slate-200 hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Claims
        </button>
        <button
          onClick={() => setTab('medical')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            tab === 'medical'
              ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md'
              : 'text-slate-200 hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" /> Medical Leave
        </button>
        <button
          onClick={() => setTab('medicines')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            tab === 'medicines'
              ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md'
              : 'text-slate-200 hover:bg-white/5'
          }`}
        >
          <Package className="w-4 h-4" /> Inventory
        </button>
        <button
          onClick={() => setTab('doctors')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            tab === 'doctors'
              ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md'
              : 'text-slate-200 hover:bg-white/5'
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Doctors
        </button>
      </div>

      {tab === 'claims' ? (
        <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-100">Insurance claims</h2>
          <div className="mt-4 space-y-3">
            {claims.length ? (
              claims.map((c) => (
                <div key={c.id} className="border border-white/10 rounded-2xl p-4 bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-100 truncate">{c.student?.name || 'Student'}</p>
                      <p className="text-sm text-slate-400 mt-1">{c.amount ? `₹${c.amount}` : 'Amount not set'}</p>
                      {c.description ? <p className="text-sm text-slate-300 mt-2">{c.description}</p> : null}
                      {c.billUrl ? (
                        <a className="text-sm text-teal-300 underline mt-2 inline-block" href={c.billUrl} target="_blank" rel="noreferrer">
                          View bill
                        </a>
                      ) : null}
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-white/5 text-slate-200 border-white/10 flex-shrink-0">
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={async () => {
                          try {
                            await updateClaim.mutateAsync({ id: c.id, data: { status: s } })
                            toast.success('Updated')
                          } catch (e: any) {
                            toast.error(e?.response?.data?.message || 'Failed')
                          }
                        }}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold text-slate-100"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No claims.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'medical' ? (
        <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-100">Medical leave requests</h2>
          <div className="mt-4 space-y-3">
            {medical.length ? (
              medical.map((r) => (
                <div key={r.id} className="border border-white/10 rounded-2xl p-4 bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-100 truncate">{r.student?.name || 'Student'}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {new Date(r.fromDate).toLocaleDateString()} → {new Date(r.toDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-300 mt-2">{r.reason}</p>
                      {r.documentUrl ? (
                        <a className="text-sm text-teal-300 underline mt-2 inline-block" href={r.documentUrl} target="_blank" rel="noreferrer">
                          View document
                        </a>
                      ) : null}
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-white/5 text-slate-200 border-white/10 flex-shrink-0">
                      {r.status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await updateMedical.mutateAsync({ id: r.id, data: { status: 'VERIFIED' } })
                          toast.success('Verified')
                        } catch (e: any) {
                          toast.error(e?.response?.data?.message || 'Failed')
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all inline-flex items-center gap-2"
                    >
                      <BadgeCheck className="w-4 h-4" /> Verify
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await updateMedical.mutateAsync({ id: r.id, data: { status: 'REJECTED' } })
                          toast.success('Rejected')
                        } catch (e: any) {
                          toast.error(e?.response?.data?.message || 'Failed')
                        }
                      }}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold text-slate-100"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No requests.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'medicines' ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-slate-100">Add medicine</h2>
            <div className="mt-4 space-y-3">
              <input
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="Medicine name"
                className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-2xl text-slate-100 placeholder-slate-500"
              />
              <input
                value={newMedStock}
                onChange={(e) => setNewMedStock(e.target.value)}
                placeholder="Stock"
                className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-2xl text-slate-100 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await createMedicine.mutateAsync({ name: newMedName, stockQty: Number(newMedStock || 0) })
                    toast.success('Created')
                    setNewMedName('')
                    setNewMedStock('0')
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || 'Failed')
                  }
                }}
                disabled={!newMedName.trim() || createMedicine.isPending}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-bold py-3 rounded-full transition-all shadow-md"
              >
                Add
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-slate-100">Inventory</h2>
            <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-2">
              {medicines.map((m) => (
                <div key={m.id} className="border border-white/10 rounded-2xl p-4 bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-100 truncate">{m.name}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Stock: <span className="font-semibold text-slate-100">{m.stockQty}</span>
                      </p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                      m.stockQty <= m.lowStockThreshold ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {m.stockQty <= m.lowStockThreshold ? 'LOW' : 'OK'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await updateMedicine.mutateAsync({ id: m.id, data: { stockQty: m.stockQty + 10 } })
                          toast.success('Stock updated')
                        } catch (e: any) {
                          toast.error(e?.response?.data?.message || 'Failed')
                        }
                      }}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold text-slate-100"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await updateMedicine.mutateAsync({ id: m.id, data: { stockQty: Math.max(0, m.stockQty - 10) } })
                          toast.success('Stock updated')
                        } catch (e: any) {
                          toast.error(e?.response?.data?.message || 'Failed')
                        }
                      }}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold text-slate-100"
                    >
                      -10
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'doctors' ? (
        <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-100">Doctors</h2>
          <p className="text-sm text-slate-400 mt-1">For hackathon demo, doctors are seeded or created externally.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((d) => (
              <div key={d.id} className="border border-white/10 rounded-2xl p-4 bg-white/5">
                <p className="font-semibold text-slate-100">{d.user?.name}</p>
                <p className="text-sm text-slate-300 mt-1">{d.specialization || 'Doctor'}</p>
                <p className="text-sm text-slate-300">{d.clinicLocation || 'Campus clinic'}</p>
                <p className="text-xs text-slate-400 mt-2">{d.availabilityNote || 'Availability not set'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
