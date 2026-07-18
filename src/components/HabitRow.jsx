import { useMemo, useState } from 'react'
import { Circle, CheckCircle2, Flame, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { addDays } from '../lib/dates'

function calculateStreak(loggedDates, today) {
  let cursor = loggedDates.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (loggedDates.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export default function HabitRow({ habit, loggedDates, todayLog, today, onEdit, onDelete }) {
  const streak = useMemo(() => calculateStreak(loggedDates, today), [loggedDates, today])
  const [amount, setAmount] = useState(todayLog?.amount_done ?? '')
  const [saving, setSaving] = useState(false)
  const hasTarget = habit.target_amount != null
  const doneToday = Boolean(todayLog)

  async function toggleDone() {
    if (doneToday) {
      const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('log_date', today)
      if (error) alert(error.message)
      return
    }
    const { error } = await supabase
      .from('habit_logs')
      .upsert({ habit_id: habit.id, log_date: today, done: true }, { onConflict: 'habit_id,log_date' })
    if (error) alert(error.message)
  }

  async function saveAmount() {
    if (amount === '') return
    setSaving(true)
    const { error } = await supabase.from('habit_logs').upsert(
      { habit_id: habit.id, log_date: today, amount_done: Number(amount), done: true },
      { onConflict: 'habit_id,log_date' },
    )
    setSaving(false)
    if (error) alert(error.message)
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
      {!hasTarget && (
        <button
          onClick={toggleDone}
          title={doneToday ? 'Tandai belum selesai' : 'Tandai selesai hari ini'}
          className="text-gray-400 hover:text-green-600"
        >
          {doneToday ? <CheckCircle2 size={22} className="text-green-600" /> : <Circle size={22} />}
        </button>
      )}

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: habit.color }} />
          <p className="font-medium text-gray-800">{habit.name}</p>
          {habit.categories?.name && (
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: `${habit.categories.color}20`, color: habit.categories.color }}
            >
              {habit.categories.name}
            </span>
          )}
        </div>
        {streak > 0 && (
          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
            <Flame size={14} /> {streak} hari berturut-turut
          </span>
        )}
      </div>

      {hasTarget && (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={saveAmount}
            placeholder="0"
            className={`w-20 rounded-lg border px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-1 ${
              doneToday ? 'border-green-300 focus:ring-green-400' : 'border-gray-300 focus:ring-blue-400'
            }`}
          />
          <span className="text-xs text-gray-400">
            / {habit.target_amount} {habit.unit_label}
          </span>
          {saving && <span className="text-xs text-gray-300">...</span>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={() => onEdit(habit)} title="Edit" className="text-blue-600 hover:text-blue-700">
          <Pencil size={16} />
        </button>
        <button onClick={() => onDelete(habit)} title="Hapus" className="text-red-600 hover:text-red-700">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
