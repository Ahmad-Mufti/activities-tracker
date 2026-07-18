import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useConfirm } from '../context/ConfirmContext'

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#a855f7', '#eab308', '#06b6d4']
const emptyForm = { name: '', color: COLORS[0] }

export default function CategoryManager({ categories }) {
  const confirm = useConfirm()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function startEdit(c) {
    setEditingId(c.id)
    setForm({ name: c.name, color: c.color })
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
    if (!form.name.trim()) {
      setError('Nama wajib diisi.')
      return
    }

    const ok = await confirm({
      title: editingId ? 'Simpan perubahan?' : 'Tambah kategori?',
      message: editingId ? `Simpan perubahan untuk kategori "${form.name}"?` : `Tambahkan kategori "${form.name}"?`,
      confirmLabel: editingId ? 'Simpan' : 'Tambah',
    })
    if (!ok) return

    setBusy(true)
    const { error } = editingId
      ? await supabase.from('categories').update(form).eq('id', editingId)
      : await supabase.from('categories').insert(form)
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    cancelEdit()
  }

  async function handleDelete(c) {
    const ok = await confirm({
      title: 'Hapus kategori?',
      message: `Hapus kategori "${c.name}"? Kebiasaan yang memakainya jadi tanpa kategori.`,
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) alert(error.message)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {categories.length === 0 && <p className="text-sm text-gray-400">Belum ada kategori.</p>}
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="font-medium text-gray-800">{c.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startEdit(c)} title="Edit" className="text-blue-600 hover:text-blue-700">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(c)} title="Hapus" className="text-red-600 hover:text-red-700">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700">{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</p>
        <input
          placeholder="Nama (mis. Rohani, Akademik, Kesehatan)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className={`h-7 w-7 rounded-full ${form.color === c ? 'ring-2 ring-gray-400 ring-offset-2' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={`Pilih warna ${c}`}
            />
          ))}
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
