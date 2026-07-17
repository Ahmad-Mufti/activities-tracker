import { useState } from 'react'
import { Pencil, Trash2, Check, Plus } from 'lucide-react'
import { useSemesters } from '../context/SemesterContext'

const emptyForm = { name: '', start_date: '', end_date: '' }

export default function SemesterManager() {
  const { semesters, createSemester, updateSemester, deleteSemester, setActive } = useSemesters()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function startEdit(s) {
    setEditingId(s.id)
    setForm({ name: s.name, start_date: s.start_date, end_date: s.end_date })
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.start_date || !form.end_date) {
      setError('Semua kolom wajib diisi.')
      return
    }
    if (form.end_date < form.start_date) {
      setError('Tanggal berakhir harus setelah tanggal mulai.')
      return
    }
    setBusy(true)
    try {
      if (editingId) {
        await updateSemester(editingId, form)
      } else {
        await createSemester(form)
      }
      cancelEdit()
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  async function handleDelete(s) {
    if (!window.confirm(`Hapus semester "${s.name}"? Semua jadwal mata kuliah di dalamnya ikut terhapus.`)) {
      return
    }
    try {
      await deleteSemester(s.id)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {semesters.length === 0 && <p className="text-sm text-gray-400">Belum ada semester.</p>}
        {semesters.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2 text-sm">
            <div>
              <p className="font-medium text-gray-800">
                {s.name}
                {s.is_active && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">Aktif</span>
                )}
              </p>
              <p className="text-xs text-gray-400">
                {s.start_date} – {s.end_date}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!s.is_active && (
                <button onClick={() => setActive(s.id)} title="Jadikan aktif" className="text-green-600 hover:text-green-700">
                  <Check size={16} />
                </button>
              )}
              <button onClick={() => startEdit(s)} title="Edit" className="text-blue-600 hover:text-blue-700">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(s)} title="Hapus" className="text-red-600 hover:text-red-700">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700">{editingId ? 'Edit Semester' : 'Tambah Semester'}</p>
        <input
          placeholder="Nama (mis. Semester Ganjil 2026/2027)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={16} /> {editingId ? 'Simpan' : 'Tambah'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
