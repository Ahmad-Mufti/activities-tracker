import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useConfirm } from '../context/ConfirmContext'
import { PriorityTierSelect, DurationMinutesField, TimeSlotSelect } from './PriorityFields'

export default function HafalanPlanForm({ plan, onDone }) {
  const confirm = useConfirm()
  const isEdit = Boolean(plan?.id)
  const [name, setName] = useState(plan?.name ?? '')
  const [contentType, setContentType] = useState(plan?.content_type ?? '')
  const [unitLabel, setUnitLabel] = useState(plan?.unit_label ?? 'baris')
  const [totalUnits, setTotalUnits] = useState(plan?.total_units ?? '')
  const [dailyPace, setDailyPace] = useState(plan?.daily_pace ?? 1)
  const [currentPosition, setCurrentPosition] = useState(plan?.current_position ?? 0)
  // Setoran hafalan baru = paling lentur (default Rutin, dikorbankan lebih dulu saat sibuk).
  const [priorityTier, setPriorityTier] = useState(plan?.priority_tier ?? 'rutin')
  const [estDurationMin, setEstDurationMin] = useState(plan?.est_duration_min ?? '')
  const [timeSlot, setTimeSlot] = useState(plan?.time_slot ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !totalUnits || !dailyPace) {
      setError('Nama, total unit, dan pace harian wajib diisi.')
      return
    }

    const ok = await confirm({
      title: isEdit ? 'Simpan perubahan?' : 'Tambah rencana hafalan?',
      message: isEdit
        ? `Simpan perubahan untuk rencana hafalan "${name.trim()}"?`
        : `Tambahkan rencana hafalan "${name.trim()}"?`,
      confirmLabel: isEdit ? 'Simpan' : 'Tambah',
    })
    if (!ok) return

    setBusy(true)
    const payload = {
      name: name.trim(),
      content_type: contentType || null,
      unit_label: unitLabel || 'baris',
      total_units: Number(totalUnits),
      daily_pace: Number(dailyPace),
      current_position: Number(currentPosition) || 0,
      priority_tier: priorityTier,
      est_duration_min: estDurationMin === '' ? null : Number(estDurationMin),
      time_slot: timeSlot || null,
    }

    const { error } = isEdit
      ? await supabase.from('hafalan_plans').update(payload).eq('id', plan.id)
      : await supabase.from('hafalan_plans').insert(payload)

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
        <label className="block text-sm font-medium text-gray-700">Nama Rencana</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="cth: Hafalan Juz 30"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Jenis Konten (opsional)</label>
        <input
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          placeholder="cth: Qur'an, Hadis, Matan"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Unit</label>
          <input
            type="number"
            required
            min="1"
            value={totalUnits}
            onChange={(e) => setTotalUnits(e.target.value)}
            placeholder="cth: 564"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Satuan</label>
          <input
            value={unitLabel}
            onChange={(e) => setUnitLabel(e.target.value)}
            placeholder="baris"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Pace Harian (unit/hari)</label>
        <input
          type="number"
          required
          min="1"
          step="1"
          value={dailyPace}
          onChange={(e) => setDailyPace(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-400">
          Berapa unit target hafalan baru per hari. Ini kecepatan santai, bukan tenggat — boleh diubah kapan saja.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Sudah Sampai Posisi (opsional)</label>
        <input
          type="number"
          min="0"
          value={currentPosition}
          onChange={(e) => setCurrentPosition(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-400">Kosongkan / 0 kalau mulai dari awal.</p>
      </div>
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
