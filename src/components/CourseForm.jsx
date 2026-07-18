import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { DAYS } from '../lib/days'
import { useConfirm } from '../context/ConfirmContext'

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#a855f7', '#eab308', '#06b6d4']

export default function CourseForm({ course, semesterId, onDone }) {
  const confirm = useConfirm()
  const isEdit = Boolean(course?.id)
  const [name, setName] = useState(course?.name ?? '')
  const [lecturer, setLecturer] = useState(course?.lecturer ?? '')
  const [dayOfWeek, setDayOfWeek] = useState(course?.day_of_week ?? 1)
  const [startTime, setStartTime] = useState(course?.start_time?.slice(0, 5) ?? '08:00')
  const [endTime, setEndTime] = useState(course?.end_time?.slice(0, 5) ?? '09:40')
  const [room, setRoom] = useState(course?.room ?? '')
  const [color, setColor] = useState(course?.color ?? COLORS[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (endTime <= startTime) {
      setError('Jam selesai harus setelah jam mulai.')
      return
    }

    const ok = await confirm({
      title: isEdit ? 'Simpan perubahan?' : 'Tambah mata kuliah?',
      message: isEdit ? `Simpan perubahan untuk mata kuliah "${name}"?` : `Tambahkan mata kuliah "${name}"?`,
      confirmLabel: isEdit ? 'Simpan' : 'Tambah',
    })
    if (!ok) return

    setBusy(true)
    const payload = {
      name,
      lecturer: lecturer || null,
      day_of_week: Number(dayOfWeek),
      start_time: startTime,
      end_time: endTime,
      room: room || null,
      color,
      semester_id: semesterId,
    }

    const { error } = isEdit
      ? await supabase.from('courses').update(payload).eq('id', course.id)
      : await supabase.from('courses').insert(payload)

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
        <label className="block text-sm font-medium text-gray-700">Nama Mata Kuliah</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Dosen</label>
        <input
          value={lecturer}
          onChange={(e) => setLecturer(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Jam Selesai</label>
          <input
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Ruang</label>
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
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
