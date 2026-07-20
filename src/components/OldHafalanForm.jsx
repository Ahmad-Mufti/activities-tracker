import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { todayLocalISO, addDays } from '../lib/dates'
import { reviewInterval } from '../lib/muraja'
import { useConfirm } from '../context/ConfirmContext'

const STAGE_OPTIONS = [
  { value: 0, label: 'Baru saja / masih lemah — diulang tiap 1 hari' },
  { value: 1, label: 'Cukup — diulang tiap 3 hari' },
  { value: 2, label: 'Lumayan kuat — diulang tiap 7 hari' },
  { value: 3, label: 'Kuat — diulang tiap 14 hari' },
  { value: 4, label: 'Sangat kuat — diulang tiap 30 hari' },
  { value: 5, label: 'Mapan / sudah lama — diulang tiap 60 hari' },
  { value: 6, label: 'Sangat mapan / bertahun-tahun — diulang tiap 120 hari' },
]

export default function OldHafalanForm({ plan, onDone }) {
  const confirm = useConfirm()
  const [unitRef, setUnitRef] = useState('')
  const [memorizedDate, setMemorizedDate] = useState(todayLocalISO())
  const [stage, setStage] = useState(3)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!unitRef.trim()) {
      setError('Isi bagian yang sudah dihafal.')
      return
    }

    const ok = await confirm({
      title: 'Tambah ke muraja\'ah?',
      message: `Tambahkan "${unitRef.trim()}" ke kolam muraja'ah?`,
      confirmLabel: 'Tambah',
    })
    if (!ok) return

    setBusy(true)
    const nextReviewDate = addDays(todayLocalISO(), reviewInterval(stage))

    const { error } = await supabase.from('hafalan_units').insert({
      plan_id: plan.id,
      unit_ref: unitRef.trim(),
      memorized_date: memorizedDate,
      review_stage: stage,
      next_review_date: nextReviewDate,
    })

    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-gray-500">
        Untuk hafalan yang sudah dikuasai sebelum pakai app — langsung masuk kolam muraja'ah, tanpa mengubah posisi
        setoran rencana <span className="font-medium">{plan.name}</span>.
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bagian yang Sudah Dihafal</label>
        <input
          required
          value={unitRef}
          onChange={(e) => setUnitRef(e.target.value)}
          placeholder="cth: Juz 30 - An-Naba"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Tanggal Dihafal (perkiraan boleh)</label>
        <input
          type="date"
          value={memorizedDate}
          onChange={(e) => setMemorizedDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Seberapa Kuat Hafalannya Sekarang?</label>
        <select
          value={stage}
          onChange={(e) => setStage(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {STAGE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? 'Menyimpan...' : "Tambah ke Muraja'ah"}
      </button>
    </form>
  )
}
