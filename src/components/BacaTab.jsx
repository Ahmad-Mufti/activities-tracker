import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import { todayLocalISO } from '../lib/dates'
import Modal from './Modal'
import ReadingPlanForm from './ReadingPlanForm'

export default function BacaTab() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState(null) // null = tertutup, {} = baru, {...} = edit
  const [amounts, setAmounts] = useState({}) // { [planId]: teks yang sedang diketik }
  const [saving, setSaving] = useState({}) // { [planId]: true/false }

  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase.from('reading_plans').select('*').order('created_at')
    if (!error) setPlans(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('reading-plans-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reading_plans', filter: `user_id=eq.${user.id}` },
        fetchPlans,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchPlans])

  async function logReading(plan) {
    const entered = Number(amounts[plan.id])
    if (!entered || entered <= 0) return

    setSaving((s) => ({ ...s, [plan.id]: true }))
    const today = todayLocalISO()

    const { data: existingLog } = await supabase
      .from('reading_logs')
      .select('amount_done')
      .eq('plan_id', plan.id)
      .eq('log_date', today)
      .maybeSingle()

    const todayTotal = (existingLog?.amount_done ?? 0) + entered
    let newPosition = plan.current_position + entered
    let khatamGained = 0
    while (newPosition >= plan.total_units) {
      newPosition -= plan.total_units
      khatamGained++
    }

    const { error: logError } = await supabase.from('reading_logs').upsert(
      { plan_id: plan.id, log_date: today, amount_done: todayTotal, position_after: newPosition },
      { onConflict: 'plan_id,log_date' },
    )

    if (!logError) {
      await supabase
        .from('reading_plans')
        .update({ current_position: newPosition, khatam_count: plan.khatam_count + khatamGained })
        .eq('id', plan.id)
    }

    setSaving((s) => ({ ...s, [plan.id]: false }))
    if (logError) {
      alert(logError.message)
      return
    }
    setAmounts((a) => ({ ...a, [plan.id]: '' }))
  }

  async function handleDelete(plan) {
    const ok = await confirm({
      title: 'Hapus rencana baca?',
      message: `Hapus rencana baca "${plan.name}"? Semua catatan hariannya ikut terhapus.`,
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('reading_plans').delete().eq('id', plan.id)
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
          <Plus size={16} /> Tambah Rencana Baca
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {plans.length === 0 && <p className="text-gray-400">Belum ada rencana baca.</p>}
        {plans.map((plan) => {
          const percent = Math.min(100, Math.round((plan.current_position / plan.total_units) * 100))
          return (
            <div key={plan.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-800">{plan.name}</p>
                    <p className="text-xs text-gray-400">
                      {plan.current_position} / {plan.total_units} {plan.unit_label}
                      {plan.khatam_count > 0 && ` · sudah khatam ${plan.khatam_count}x`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingPlan(plan)} title="Edit" className="text-blue-600 hover:text-blue-700">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(plan)} title="Hapus" className="text-red-600 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${percent}%` }} />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amounts[plan.id] ?? ''}
                  onChange={(e) => setAmounts((a) => ({ ...a, [plan.id]: e.target.value }))}
                  placeholder={`Catat ${plan.unit_label} hari ini`}
                  className="w-40 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => logReading(plan)}
                  disabled={saving[plan.id]}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving[plan.id] ? 'Menyimpan...' : 'Catat'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {editingPlan !== null && (
        <Modal title={editingPlan.id ? 'Edit Rencana Baca' : 'Tambah Rencana Baca'} onClose={() => setEditingPlan(null)}>
          <ReadingPlanForm plan={editingPlan} onDone={() => setEditingPlan(null)} />
        </Modal>
      )}
    </div>
  )
}
