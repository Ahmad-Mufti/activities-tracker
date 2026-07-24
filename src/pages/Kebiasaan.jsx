import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Settings } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import { todayLocalISO, addDays } from '../lib/dates'
import Modal from '../components/Modal'
import CategoryManager from '../components/CategoryManager'
import HabitForm from '../components/HabitForm'
import HabitRow from '../components/HabitRow'

const HISTORY_DAYS = 365

export default function Kebiasaan() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const today = todayLocalISO()
  const [categories, setCategories] = useState([])
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null) // null = tertutup, {} = baru, {...} = edit

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (!error) setCategories(data)
  }, [])

  const fetchHabits = useCallback(async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*, categories(name, color)')
      .order('created_at')
    if (!error) setHabits(data)
    setLoading(false)
  }, [])

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .gte('log_date', addDays(today, -HISTORY_DAYS))
    if (!error) setLogs(data)
  }, [today])

  useEffect(() => {
    fetchCategories()
    fetchHabits()
    fetchLogs()
  }, [fetchCategories, fetchHabits, fetchLogs])

  useEffect(() => {
    if (!user) return
    const channels = [
      supabase
        .channel('categories-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` },
          fetchCategories,
        )
        .subscribe(),
      supabase
        .channel('habits-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${user.id}` },
          fetchHabits,
        )
        .subscribe(),
      supabase
        .channel('habit-logs-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'habit_logs', filter: `user_id=eq.${user.id}` },
          fetchLogs,
        )
        .subscribe(),
    ]
    return () => channels.forEach((c) => supabase.removeChannel(c))
  }, [user, fetchCategories, fetchHabits, fetchLogs])

  const logsByHabit = useMemo(() => {
    const map = new Map()
    for (const log of logs) {
      if (!map.has(log.habit_id)) map.set(log.habit_id, { byDate: new Map(), today: null })
      const entry = map.get(log.habit_id)
      entry.byDate.set(log.log_date, log)
      if (log.log_date === today) entry.today = log
    }
    return map
  }, [logs, today])

  async function handleDeleteHabit(habit) {
    const ok = await confirm({
      title: 'Hapus kebiasaan?',
      message: `Hapus kebiasaan "${habit.name}"? Riwayat centangnya ikut terhapus.`,
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('habits').delete().eq('id', habit.id)
    if (error) alert(error.message)
  }

  if (loading) {
    return <p className="text-gray-400">Memuat...</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">Kebiasaan</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryManager(true)}
            title="Kelola kategori"
            className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => setEditingHabit({})}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} /> Tambah Kebiasaan
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {habits.length === 0 && <p className="text-gray-400">Belum ada kebiasaan. Tambah satu untuk mulai.</p>}
        {habits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            logsByDate={logsByHabit.get(habit.id)?.byDate ?? new Map()}
            todayLog={logsByHabit.get(habit.id)?.today ?? null}
            today={today}
            onEdit={setEditingHabit}
            onDelete={handleDeleteHabit}
          />
        ))}
      </div>

      {editingHabit !== null && (
        <Modal title={editingHabit.id ? 'Edit Kebiasaan' : 'Tambah Kebiasaan'} onClose={() => setEditingHabit(null)}>
          <HabitForm habit={editingHabit} categories={categories} onDone={() => setEditingHabit(null)} />
        </Modal>
      )}

      {showCategoryManager && (
        <Modal title="Kelola Kategori" onClose={() => setShowCategoryManager(false)}>
          <CategoryManager categories={categories} />
        </Modal>
      )}
    </div>
  )
}
