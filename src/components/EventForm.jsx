import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useConfirm } from '../context/ConfirmContext'
import { todayLocalISO } from '../lib/dates'

export default function EventForm({ event, onDone }) {
  const confirm = useConfirm()
  const isEdit = Boolean(event?.id)
  const [title, setTitle] = useState(event?.title ?? '')
  const [eventDate, setEventDate] = useState(event?.event_date ?? todayLocalISO())
  const [allDay, setAllDay] = useState(event?.all_day ?? false)
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) ?? '')
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) ?? '')
  const [category, setCategory] = useState(event?.category ?? '')
  const [note, setNote] = useState(event?.note ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Judul wajib diisi.')
      return
    }
    if (!eventDate) {
      setError('Tanggal wajib diisi.')
      return
    }

    const ok = await confirm({
      title: isEdit ? 'Simpan perubahan?' : 'Tambah event?',
      message: isEdit ? `Simpan perubahan untuk event "${title.trim()}"?` : `Tambahkan event "${title.trim()}"?`,
      confirmLabel: isEdit ? 'Simpan' : 'Tambah',
    })
    if (!ok) return

    setBusy(true)
    const payload = {
      title: title.trim(),
      event_date: eventDate,
      all_day: allDay,
      start_time: allDay ? null : startTime || null,
      end_time: allDay ? null : endTime || null,
      category: category || null,
      note: note || null,
    }

    const { error } = isEdit
      ? await supabase.from('events').update(payload).eq('id', event.id)
      : await supabase.from('events').insert(payload)

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
        <label className="block text-sm font-medium text-gray-700">Tanggal</label>
        <input
          required
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        Sepanjang hari
      </label>
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mulai</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Selesai</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Kategori (opsional)</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="mis. Akademik, Organisasi"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Catatan (opsional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
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
