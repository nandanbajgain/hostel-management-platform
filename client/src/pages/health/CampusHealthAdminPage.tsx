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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Campus Health • Admin</h1>
          <p className="text-gray-600 mt-1">Claims, medical documents, inventory, and oversight.</p>
        </div>
      </div>

      <div className="mt-6 bg-white/85 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setTab('claims')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            tab === 'claims' ? 'bg-gray-900 text-white' : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Claims
        </button>
        <button
          onClick={() => setTab('medical')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            tab === 'medical' ? 'bg-gray-900 text-white' : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Medical Leave
        </button>
        <button
          onClick={() => setTab('medicines')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            tab === 'medicines' ? 'bg-gray-900 text-white' : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Package className="w-4 h-4" /> Inventory
        </button>
        <button
          onClick={() => setTab('doctors')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            tab === 'doctors' ? 'bg-gray-900 text-white' : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Doctors
        </button>
      </div>

      {tab === 'claims' ? (
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900">Insurance claims</h2>
          <div className="mt-4 space-y-3">
            {claims.length ? (
              claims.map((c) => (
                <div key={c.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{c.student?.name || 'Student'}</p>
                      <p className="text-sm text-gray-600 mt-1">{c.amount ? `₹${c.amount}` : 'Amount not set'}</p>
                      {c.description ? <p className="text-sm text-gray-600 mt-2">{c.description}</p> : null}
                      {c.billUrl ? (
                        <a className="text-sm text-teal-700 underline mt-2 inline-block" href={c.billUrl} target="_blank" rel="noreferrer">
                          View bill
                        </a>
                      ) : null}
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200 flex-shrink-0">
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
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No claims.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'medical' ? (
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900">Medical leave requests</h2>
          <div className="mt-4 space-y-3">
            {medical.length ? (
              medical.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{r.student?.name || 'Student'}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(r.fromDate).toLocaleDateString()} → {new Date(r.toDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">{r.reason}</p>
                      {r.documentUrl ? (
                        <a className="text-sm text-teal-700 underline mt-2 inline-block" href={r.documentUrl} target="_blank" rel="noreferrer">
                          View document
                        </a>
                      ) : null}
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200 flex-shrink-0">
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
                      className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No requests.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'medicines' ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900">Add medicine</h2>
            <div className="mt-4 space-y-3">
              <input
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="Medicine name"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
              />
              <input
                value={newMedStock}
                onChange={(e) => setNewMedStock(e.target.value)}
                placeholder="Stock"
                className="w-full bg-white px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500"
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
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-full transition-all"
              >
                Add
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900">Inventory</h2>
            <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-2">
              {medicines.map((m) => (
                <div key={m.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Stock: <span className="font-semibold text-gray-900">{m.stockQty}</span>
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
                      className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold"
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
                      className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold"
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
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900">Doctors</h2>
          <p className="text-sm text-gray-600 mt-1">For hackathon demo, doctors are seeded or created externally.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((d) => (
              <div key={d.id} className="border border-gray-200 rounded-2xl p-4">
                <p className="font-semibold text-gray-900">{d.user?.name}</p>
                <p className="text-sm text-gray-600 mt-1">{d.specialization || 'Doctor'}</p>
                <p className="text-sm text-gray-600">{d.clinicLocation || 'Campus clinic'}</p>
                <p className="text-xs text-gray-500 mt-2">{d.availabilityNote || 'Availability not set'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

