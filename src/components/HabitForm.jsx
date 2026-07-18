import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useConfirm } from '../context/ConfirmContext'

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#a855f7', '#eab308', '#06b6d4']

export default function HabitForm({ habit, categories, onDone }) {
  const confirm = useConfirm()
  const isEdit = Boolean(habit?.id)
  const [name, setName] = useState(habit?.name ?? '')
  const [categoryId, setCategoryId] = useState(habit?.category_id ?? '')
  const [targetAmount, setTargetAmount] = useState(habit?.target_amount ?? '')
  const [unitLabel, setUnitLabel] = useState(habit?.unit_label ?? '')
  const [color, setColor] = useState(habit?.color ?? COLORS[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nama wajib diisi.')
      return
    }

    const ok = await confirm({
      title: isEdit ? 'Simpan perubahan?' : 'Tambah kebiasaan?',
      message: isEdit
        ? `Simpan perubahan untuk kebiasaan "${name.trim()}"?`
        : `Tambahkan kebiasaan "${name.trim()}"?`,
      confirmLabel: isEdit ? 'Simpan' : 'Tambah',
    })
    if (!ok) return

    setBusy(true)
    const payload = {
      name: name.trim(),
      category_id: categoryId || null,
      target_amount: targetAmount === '' ? null : Number(targetAmount),
      unit_label: unitLabel || null,
      color,
    }

    const { error } = isEdit
      ? await supabase.from('habits').update(payload).eq('id', habit.id)
      : await supabase.from('habits').insert(payload)

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
        <label className="block text-sm font-medium text-gray-700">Nama Kebiasaan</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="cth: Baca buku, Olahraga, Tidur cepat"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Kategori (opsional)</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tidak ada kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Target (opsional)</label>
          <input
            type="number"
            min="0"
            step="any"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="mis. 30"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Satuan (opsional)</label>
          <input
            value={unitLabel}
            onChange={(e) => setUnitLabel(e.target.value)}
            placeholder="mis. halaman, menit"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Kosongkan Target kalau kebiasaan ini cukup ditandai selesai/belum tanpa jumlah (mis. "Sholat Subuh
        berjamaah").
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700">Warna</label>
        <div className="mt-1 flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full ${color === c ? 'ring-2 ring-gray-400 ring-offset-2' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={`Pilih warna ${c}`}
            />
          ))}
        </div>
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
