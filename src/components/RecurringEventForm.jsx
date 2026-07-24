import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useConfirm } from '../context/ConfirmContext'
import { DAYS } from '../lib/days'

const COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f97316', '#ef4444', '#eab308', '#06b6d4']

export default function RecurringEventForm({ item, projects, onDone }) {
  const confirm = useConfirm()
  const isEdit = Boolean(item?.id)
  const [title, setTitle] = useState(item?.title ?? '')
  const [dayOfWeek, setDayOfWeek] = useState(item?.day_of_week ?? 1)
  const [startTime, setStartTime] = useState(item?.start_time?.slice(0, 5) ?? '')
  const [endTime, setEndTime] = useState(item?.end_time?.slice(0, 5) ?? '')
  const [category, setCategory] = useState(item?.category ?? '')
  const [projectId, setProjectId] = useState(item?.project_id ?? '')
  const [validFrom, setValidFrom] = useState(item?.valid_from ?? '')
  const [validUntil, setValidUntil] = useState(item?.valid_until ?? '')
  const [color, setColor] = useState(item?.color ?? COLORS[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Judul wajib diisi.')
      return
    }
    if (startTime && endTime && endTime <= startTime) {
      setError('Jam selesai harus setelah jam mulai.')
      return
    }

    const ok = await confirm({
      title: isEdit ? 'Simpan perubahan?' : 'Tambah kegiatan rutin?',
      message: isEdit
        ? `Simpan perubahan untuk kegiatan rutin "${title.trim()}"?`
        : `Tambahkan kegiatan rutin "${title.trim()}"?`,
      confirmLabel: isEdit ? 'Simpan' : 'Tambah',
    })
    if (!ok) return

    setBusy(true)
    const payload = {
      title: title.trim(),
      day_of_week: Number(dayOfWeek),
      start_time: startTime || null,
      end_time: endTime || null,
      category: category || null,
      project_id: projectId || null,
      valid_from: validFrom || null,
      valid_until: validUntil || null,
      color,
    }

    const { error } = isEdit
      ? await supabase.from('recurring_events').update(payload).eq('id', item.id)
      : await supabase.from('recurring_events').insert(payload)

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
        <label className="block text-sm font-medium text-gray-700">Judul</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="cth: Rapat Organisasi"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Hari</label>
        <select
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Jam Mulai</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Jam Selesai</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Kategori (opsional)</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="mis. Organisasi"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Proyek (opsional)</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tidak ada</option>
          {(projects ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Berlaku Mulai (opsional)</label>
          <input
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Berlaku Sampai (opsional)</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">Kosongkan kalau berlaku terus, tidak dibatasi tanggal.</p>
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
