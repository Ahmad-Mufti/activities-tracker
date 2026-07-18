import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useConfirm } from '../context/ConfirmContext'

export default function ReadingPlanForm({ plan, onDone }) {
  const confirm = useConfirm()
  const isEdit = Boolean(plan?.id)
  const [name, setName] = useState(plan?.name ?? '')
  const [type, setType] = useState(plan?.type ?? '')
  const [unitLabel, setUnitLabel] = useState(plan?.unit_label ?? 'halaman')
  const [totalUnits, setTotalUnits] = useState(plan?.total_units ?? '')
  const [currentPosition, setCurrentPosition] = useState(plan?.current_position ?? 0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !totalUnits) {
      setError('Nama dan total unit menuju khatam wajib diisi.')
      return
    }

    const ok = await confirm({
      title: isEdit ? 'Simpan perubahan?' : 'Tambah rencana baca?',
      message: isEdit ? `Simpan perubahan untuk rencana baca "${name.trim()}"?` : `Tambahkan rencana baca "${name.trim()}"?`,
      confirmLabel: isEdit ? 'Simpan' : 'Tambah',
    })
    if (!ok) return

    setBusy(true)
    const payload = {
      name: name.trim(),
      type: type || null,
      unit_label: unitLabel || 'halaman',
      total_units: Number(totalUnits),
      current_position: Number(currentPosition) || 0,
    }

    const { error } = isEdit
      ? await supabase.from('reading_plans').update(payload).eq('id', plan.id)
      : await supabase.from('reading_plans').insert(payload)

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
          placeholder="cth: Qur'an, Hadis Arbain"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Jenis (opsional)</label>
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="cth: Qur'an, Hadis"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Menuju Khatam</label>
          <input
            type="number"
            required
            min="1"
            value={totalUnits}
            onChange={(e) => setTotalUnits(e.target.value)}
            placeholder="cth: 604"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Satuan</label>
          <input
            value={unitLabel}
            onChange={(e) => setUnitLabel(e.target.value)}
            placeholder="halaman"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
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
