import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useConfirm } from '../context/ConfirmContext'

function toDateInputValue(timestamptz) {
  if (!timestamptz) return ''
  return new Date(timestamptz).toISOString().slice(0, 10)
}

export default function ProjectForm({ project, onDone }) {
  const confirm = useConfirm()
  const isEdit = Boolean(project?.id)
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [deadline, setDeadline] = useState(toDateInputValue(project?.deadline))
  const [status, setStatus] = useState(project?.status ?? 'active')
  const [weeklyHours, setWeeklyHours] = useState(project?.weekly_hours ?? '')
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
      title: isEdit ? 'Simpan perubahan?' : 'Tambah proyek?',
      message: isEdit ? `Simpan perubahan untuk proyek "${name.trim()}"?` : `Tambahkan proyek "${name.trim()}"?`,
      confirmLabel: isEdit ? 'Simpan' : 'Tambah',
    })
    if (!ok) return

    setBusy(true)
    const payload = {
      name: name.trim(),
      description: description || null,
      deadline: deadline ? new Date(`${deadline}T23:59:59`).toISOString() : null,
      status,
      weekly_hours: weeklyHours === '' ? null : Number(weeklyHours),
    }

    const { error } = isEdit
      ? await supabase.from('projects').update(payload).eq('id', project.id)
      : await supabase.from('projects').insert(payload)

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
        <label className="block text-sm font-medium text-gray-700">Nama Proyek</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="cth: Website Kampus"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Deskripsi (opsional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Deadline (opsional)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="active">Aktif</option>
            <option value="done">Selesai</option>
            <option value="archived">Diarsipkan</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Beban Mingguan (jam/minggu, opsional)</label>
        <input
          type="number"
          min="0"
          step="any"
          value={weeklyHours}
          onChange={(e) => setWeeklyHours(e.target.value)}
          placeholder="mis. 5"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-400">
          Jam per minggu yang dialokasikan proyek ini — mengurangi waktu luang harian meski jadwal detailnya belum
          jelas. Dicek ulang tiap weekly review.
        </p>
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
