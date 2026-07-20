import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { todayLocalISO, addDays } from '../lib/dates'
import { reviewInterval } from '../lib/muraja'

export default function MurajaahTab() {
  const { user } = useAuth()
  const today = todayLocalISO()
  const [cap, setCap] = useState(null) // null = belum tahu, tunggu settings
  const [units, setUnits] = useState([])
  const [totalDue, setTotalDue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busyUnitId, setBusyUnitId] = useState(null)

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('user_settings').select('muraja_daily_cap').maybeSingle()
    setCap(data?.muraja_daily_cap ?? 15)
  }, [])

  const fetchQueue = useCallback(async () => {
    if (cap === null) return
    setLoading(true)
    const { data, error, count } = await supabase
      .from('hafalan_units')
      .select('*, hafalan_plans(name, unit_label)', { count: 'exact' })
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true })
      .order('memorized_date', { ascending: true })
      .limit(cap)
    if (!error) {
      setUnits(data)
      setTotalDue(count ?? data.length)
    }
    setLoading(false)
  }, [today, cap])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  useEffect(() => {
    if (!user) return
    const channels = [
      supabase
        .channel('muraja-units-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'hafalan_units', filter: `user_id=eq.${user.id}` },
          fetchQueue,
        )
        .subscribe(),
      supabase
        .channel('muraja-settings-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${user.id}` },
          fetchSettings,
        )
        .subscribe(),
    ]
    return () => channels.forEach((c) => supabase.removeChannel(c))
  }, [user, fetchQueue, fetchSettings])

  async function markResult(unit, result) {
    setBusyUnitId(unit.id)
    const newStage = result === 'lancar' ? Math.min(unit.review_stage + 1, 6) : 0
    const interval = result === 'lancar' ? reviewInterval(newStage) : 1
    const nextReviewDate = addDays(today, interval)

    const { error: updateError } = await supabase
      .from('hafalan_units')
      .update({ review_stage: newStage, next_review_date: nextReviewDate })
      .eq('id', unit.id)

    if (!updateError) {
      const { error: logError } = await supabase
        .from('review_logs')
        .insert({ unit_id: unit.id, review_date: today, result })
      if (logError) alert(logError.message)
    }
    setBusyUnitId(null)
    if (updateError) alert(updateError.message)
  }

  if (loading) {
    return <p className="text-gray-400">Memuat...</p>
  }

  return (
    <div>
      <p className="text-sm text-gray-500">
        {totalDue === 0
          ? "Tidak ada muraja'ah jatuh tempo hari ini. 🎉"
          : totalDue > units.length
            ? `Menampilkan ${units.length} dari ${totalDue} unit yang jatuh tempo hari ini — sisanya otomatis muncul besok.`
            : `${totalDue} unit jatuh tempo hari ini.`}
      </p>

      <div className="mt-4 space-y-2">
        {units.map((unit) => (
          <div key={unit.id} className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-gray-800">{unit.unit_ref}</p>
                <p className="text-xs text-gray-400">
                  {unit.hafalan_plans?.name} · tahap {unit.review_stage + 1}/7
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => markResult(unit, 'lancar')}
                  disabled={busyUnitId === unit.id}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Lancar
                </button>
                <button
                  onClick={() => markResult(unit, 'tersendat')}
                  disabled={busyUnitId === unit.id}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  Tersendat
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
