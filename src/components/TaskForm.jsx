import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useConfirm } from '../context/ConfirmContext'
import { DurationMinutesField } from './PriorityFields'
import { todayLocalISO } from '../lib/dates'

function toLocalInputValue(timestamptz) {
  if (!timestamptz) return ''
  const d = new Date(timestamptz)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TaskForm({ task, courses, projects, onDone }) {
  const confirm = useConfirm()
  const isEdit = Boolean(task?.id)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [dueDate, setDueDate] = useState(toLocalInputValue(task?.due_date))
  const [priority, setPriority] = useState(task?.priority ?? 'medium')
  const [status, setStatus] = useState(task?.status ?? 'todo')
  const [courseId, setCourseId] = useState(task?.course_id ?? '')
  const [projectId, setProjectId] = useState(task?.project_id ?? '')
  const [plannedFor, setPlannedFor] = useState(task?.planned_for ?? '')
  const [estDurationMin, setEstDurationMin] = useState(task?.est_duration_min ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Default durasi per-konteks (6C): saat tambah tugas baru & pilih course/proyek, ambil
  // est_duration_min tugas terbaru dengan course/proyek sama sebagai prefill (tak pernah wajib).
  useEffect(() => {
    if (isEdit || estDurationMin !== '' || (!courseId && !projectId)) return
    let cancelled = false
    async function prefill() {
      let query = supabase
        .from('tasks')
        .select('est_duration_min')
        .not('est_duration_min', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
      query = courseId ? query.eq('course_id', courseId) : query.eq('project_id', projectId)
      const { data } = await query.maybeSingle()
      if (!cancelled && data?.est_duration_min != null) setEstDurationMin(String(data.est_duration_min))
    }
    prefill()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, projectId, isEdit])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Judul wajib diisi.')
      return
    }

    const ok = await confirm({
      title: isEdit ? 'Simpan perubahan?' : 'Tambah tugas?',
      message: isEdit ? `Simpan perubahan untuk tugas "${title.trim()}"?` : `Tambahkan tugas "${title.trim()}"?`,
      confirmLabel: isEdit ? 'Simpan' : 'Tambah',
    })
    if (!ok) return

    setBusy(true)
    const payload = {
      title: title.trim(),
      description: description || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      priority,
      status,
      course_id: courseId || null,
      project_id: projectId || null,
      planned_for: plannedFor || null,
      est_duration_min: estDurationMin === '' ? null : Number(estDurationMin),
    }

    const { error } = isEdit
      ? await supabase.from('tasks').update(payload).eq('id', task.id)
      : await supabase.from('tasks').insert(payload)

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
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Jatuh Tempo</label>
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Prioritas</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="todo">Belum</option>
            <option value="doing">Dikerjakan</option>
            <option value="done">Selesai</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Mata Kuliah (opsional)</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Tidak ada</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Rencana Kerjakan (opsional)</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="date"
            value={plannedFor}
            onChange={(e) => setPlannedFor(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setPlannedFor(todayLocalISO())}
            className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Hari ini
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">"Kerjakan hari ini" — masuk anggaran waktu tanggal tsb.</p>
      </div>
      <DurationMinutesField value={estDurationMin} onChange={setEstDurationMin} />

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
