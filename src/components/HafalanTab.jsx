import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, BrainCog } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import { todayLocalISO, addDays, isoDayOfWeek } from '../lib/dates'
import Modal from './Modal'
import HafalanPlanForm from './HafalanPlanForm'
import OldHafalanForm from './OldHafalanForm'

export default function HafalanTab() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const today = todayLocalISO()
  const [plans, setPlans] = useState([])
  const [dayOff, setDayOff] = useState(7)
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState(null) // null = tertutup, {} = baru, {...} = edit
  const [addingOldFor, setAddingOldFor] = useState(null) // rencana yang mau ditambah hafalan lamanya
  const [busyPlanId, setBusyPlanId] = useState(null)

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('user_settings').select('day_off_of_week').maybeSingle()
    setDayOff(data?.day_off_of_week ?? 7)
  }, [])

  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase.from('hafalan_plans').select('*').order('created_at')
    if (!error) setPlans(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchPlans()
  }, [fetchSettings, fetchPlans])

  useEffect(() => {
    if (!user) return
    const channels = [
      supabase
        .channel('hafalan-plans-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'hafalan_plans', filter: `user_id=eq.${user.id}` },
          fetchPlans,
        )
        .subscribe(),
      supabase
        .channel('hafalan-settings-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${user.id}` },
          fetchSettings,
        )
        .subscribe(),
    ]
    return () => channels.forEach((c) => supabase.removeChannel(c))
  }, [user, fetchPlans, fetchSettings])

  const isDayOff = isoDayOfWeek(new Date()) === dayOff

  async function markSetoranDone(plan) {
    const remaining = plan.total_units - plan.current_position
    const unitsToAdd = Math.min(plan.daily_pace, remaining)
    if (unitsToAdd <= 0) return

    setBusyPlanId(plan.id)
    const newUnits = Array.from({ length: unitsToAdd }, (_, i) => ({
      plan_id: plan.id,
      unit_ref: `${plan.unit_label} ke-${plan.current_position + i + 1}`,
      memorized_date: today,
      review_stage: 0,
      next_review_date: addDays(today, 1),
    }))

    const { error: unitsError } = await supabase.from('hafalan_units').insert(newUnits)
    if (!unitsError) {
      await supabase
        .from('hafalan_plans')
        .update({ current_position: plan.current_position + unitsToAdd })
        .eq('id', plan.id)
    }
    setBusyPlanId(null)
    if (unitsError) alert(unitsError.message)
  }

  async function handleDeletePlan(plan) {
    const ok = await confirm({
      title: 'Hapus rencana hafalan?',
      message: `Hapus rencana hafalan "${plan.name}"? Semua unit yang sudah dihafal & riwayat muraja'ah-nya ikut terhapus.`,
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('hafalan_plans').delete().eq('id', plan.id)
    if (error) alert(error.message)
  }

  if (loading) {
    return <p className="text-gray-400">Memuat...</p>
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => setEditingPlan({})}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Tambah Rencana Hafalan
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {plans.length === 0 && <p className="text-gray-400">Belum ada rencana hafalan.</p>}
        {plans.map((plan) => {
          const finished = plan.current_position >= plan.total_units
          const fromUnit = plan.current_position + 1
          const toUnit = Math.min(plan.current_position + plan.daily_pace, plan.total_units)
          const remaining = plan.total_units - plan.current_position
          const daysNeeded = Math.ceil(remaining / plan.daily_pace)
          const estimatedDate = addDays(today, daysNeeded)

          return (
            <div key={plan.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BrainCog size={18} className="text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-800">{plan.name}</p>
                    <p className="text-xs text-gray-400">
                      {plan.current_position} / {plan.total_units} {plan.unit_label} · pace {plan.daily_pace}/hari
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingPlan(plan)} title="Edit" className="text-blue-600 hover:text-blue-700">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDeletePlan(plan)} title="Hapus" className="text-red-600 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                {finished ? (
                  <p className="text-green-600">🎉 Hafalan selesai! Muraja'ah tetap lanjut menjaga hafalannya.</p>
                ) : isDayOff ? (
                  <p className="text-gray-500">Hari ini libur setoran hafalan baru — waktunya fokus muraja'ah saja.</p>
                ) : (
                  <>
                    <p className="text-gray-700">
                      Setoran hari ini:{' '}
                      <span className="font-medium">
                        {plan.unit_label} ke-{fromUnit}
                        {toUnit !== fromUnit && ` sampai ke-${toUnit}`}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Perkiraan selesai: sekitar {estimatedDate} (info saja, santai bergeser sesuai ritmemu)
                    </p>
                    <button
                      onClick={() => markSetoranDone(plan)}
                      disabled={busyPlanId === plan.id}
                      className="mt-2 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {busyPlanId === plan.id ? 'Menyimpan...' : 'Tandai Setoran Selesai'}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setAddingOldFor(plan)}
                className="mt-2 text-xs font-medium text-blue-600 hover:underline"
              >
                + Tambah hafalan lama (sudah dikuasai sebelum pakai app)
              </button>
            </div>
          )
        })}
      </div>

      {editingPlan !== null && (
        <Modal
          title={editingPlan.id ? 'Edit Rencana Hafalan' : 'Tambah Rencana Hafalan'}
          onClose={() => setEditingPlan(null)}
        >
          <HafalanPlanForm plan={editingPlan} onDone={() => setEditingPlan(null)} />
        </Modal>
      )}

      {addingOldFor && (
        <Modal title="Tambah Hafalan Lama" onClose={() => setAddingOldFor(null)}>
          <OldHafalanForm plan={addingOldFor} onDone={() => setAddingOldFor(null)} />
        </Modal>
      )}
    </div>
  )
}
