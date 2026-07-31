import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useConfirm } from '../context/ConfirmContext'
import { PriorityTierSelect, DurationMinutesField, TimeSlotSelect } from './PriorityFields'

export default function KajianSeriesForm({ series, onDone }) {
  const confirm = useConfirm()
  const isEdit = Boolean(series?.id)
  const [name, setName] = useState(series?.name ?? '')
  const [totalSessions, setTotalSessions] = useState(series?.total_sessions ?? '')
  const [currentSession, setCurrentSession] = useState(series?.current_session ?? 0)
  // Kajian = default Rutin (tabel 6B) — paling mudah digeser saat waktu sempit.
  const [priorityTier, setPriorityTier] = useState(series?.priority_tier ?? 'rutin')
  const [estDurationMin, setEstDurationMin] = useState(series?.est_duration_min ?? '')
  const [timeSlot, setTimeSlot] = useState(series?.time_slot ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !totalSessions) {
      setError('Nama dan total sesi wajib diisi.')
      return
    }

    const ok = await confirm({
      title: isEdit ? 'Simpan perubahan?' : 'Tambah kajian?',
      message: isEdit ? `Simpan perubahan untuk kajian "${name.trim()}"?` : `Tambahkan kajian "${name.trim()}"?`,
      confirmLabel: isEdit ? 'Simpan' : 'Tambah',
    })
    if (!ok) return

    setBusy(true)
    const payload = {
      name: name.trim(),
      total_sessions: Number(totalSessions),
      current_session: Number(currentSession) || 0,
      priority_tier: priorityTier,
      est_duration_min: estDurationMin === '' ? null : Number(estDurationMin),
      time_slot: timeSlot || null,
    }

    const { error } = isEdit
      ? await supabase.from('kajian_series').update(payload).eq('id', series.id)
      : await supabase.from('kajian_series').insert(payload)

    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }

    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nama Kajian</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="cth: Kitab Arbain Nawawi"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Sesi</label>
          <input
            type="number"
            required
            min="1"
            value={totalSessions}
            onChange={(e) => setTotalSessions(e.target.value)}
            placeholder="cth: 30"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Sudah Sampai Sesi (opsional)</label>
          <input
            type="number"
            min="0"
            value={currentSession}
            onChange={(e) => setCurrentSession(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">Kosongkan / 0 pada "Sudah Sampai Sesi" kalau mulai dari awal.</p>

      <PriorityTierSelect value={priorityTier} onChange={setPriorityTier} />
      <DurationMinutesField value={estDurationMin} onChange={setEstDurationMin} />
      <TimeSlotSelect value={timeSlot} onChange={setTimeSlot} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah'}
      </button>
    </form>
  )
}
