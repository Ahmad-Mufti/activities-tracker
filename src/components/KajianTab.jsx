import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Headphones } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import { todayLocalISO } from '../lib/dates'
import Modal from './Modal'
import KajianSeriesForm from './KajianSeriesForm'

export default function KajianTab() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const [seriesList, setSeriesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingSeries, setEditingSeries] = useState(null) // null = tertutup, {} = baru, {...} = edit
  const [saving, setSaving] = useState({}) // { [seriesId]: true/false }

  const fetchSeries = useCallback(async () => {
    const { data, error } = await supabase.from('kajian_series').select('*').order('created_at')
    if (!error) setSeriesList(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSeries()
  }, [fetchSeries])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('kajian-series-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kajian_series', filter: `user_id=eq.${user.id}` },
        fetchSeries,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchSeries])

  async function logSession(series) {
    if (series.current_session >= series.total_sessions) return
    setSaving((s) => ({ ...s, [series.id]: true }))
    const nextSession = series.current_session + 1

    const { error: logError } = await supabase.from('kajian_logs').upsert(
      { series_id: series.id, session_number: nextSession, log_date: todayLocalISO() },
      { onConflict: 'series_id,session_number' },
    )

    if (!logError) {
      await supabase.from('kajian_series').update({ current_session: nextSession }).eq('id', series.id)
    }

    setSaving((s) => ({ ...s, [series.id]: false }))
    if (logError) alert(logError.message)
  }

  async function handleDelete(series) {
    const ok = await confirm({
      title: 'Hapus kajian?',
      message: `Hapus kajian "${series.name}"? Semua catatan sesinya ikut terhapus.`,
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('kajian_series').delete().eq('id', series.id)
    if (error) alert(error.message)
  }

  if (loading) {
    return <p className="text-gray-400">Memuat...</p>
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => setEditingSeries({})}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Tambah Kajian
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {seriesList.length === 0 && <p className="text-gray-400">Belum ada kajian yang diikuti.</p>}
        {seriesList.map((series) => {
          const percent = Math.min(100, Math.round((series.current_session / series.total_sessions) * 100))
          const done = series.current_session >= series.total_sessions
          return (
            <div key={series.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Headphones size={18} className="text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-800">{series.name}</p>
                    <p className="text-xs text-gray-400">
                      Sesi {series.current_session} / {series.total_sessions}
                      {done && ' · selesai'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingSeries(series)} title="Edit" className="text-blue-600 hover:text-blue-700">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(series)} title="Hapus" className="text-red-600 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${percent}%` }} />
              </div>

              <div className="mt-3">
                <button
                  onClick={() => logSession(series)}
                  disabled={done || saving[series.id]}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving[series.id]
                    ? 'Menyimpan...'
                    : done
                      ? 'Sudah tuntas'
                      : `Tandai sesi ke-${series.current_session + 1} selesai`}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {editingSeries !== null && (
        <Modal title={editingSeries.id ? 'Edit Kajian' : 'Tambah Kajian'} onClose={() => setEditingSeries(null)}>
          <KajianSeriesForm series={editingSeries} onDone={() => setEditingSeries(null)} />
        </Modal>
      )}
    </div>
  )
}
