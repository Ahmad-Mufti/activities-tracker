import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useConfirm } from '../context/ConfirmContext'
import { useSemesters } from '../context/SemesterContext'
import { todayLocalISO, isoDayOfWeek, fromLocalISO } from '../lib/dates'
import {
  resolveCoursesForDate,
  overlapMinutes,
  timeToMinutes,
  computeFreeMinutes,
  computeTotalRencana,
  minutesToLabel,
} from '../lib/timeBudget'

export default function EventForm({ event, projects, onDone }) {
  const confirm = useConfirm()
  const { activeSemester } = useSemesters()
  const isEdit = Boolean(event?.id)
  const [title, setTitle] = useState(event?.title ?? '')
  const [eventDate, setEventDate] = useState(event?.event_date ?? todayLocalISO())
  const [allDay, setAllDay] = useState(event?.all_day ?? false)
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) ?? '')
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) ?? '')
  const [category, setCategory] = useState(event?.category ?? '')
  const [projectId, setProjectId] = useState(event?.project_id ?? '')
  const [note, setNote] = useState(event?.note ?? '')
  const [conflictChoice, setConflictChoice] = useState('prioritize') // 'prioritize' | 'skip_class'
  const [dayContext, setDayContext] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Data seputar tanggal event — dipakai deteksi bentrok jadwal & pratinjau dampak anggaran waktu (6C).
  useEffect(() => {
    if (!eventDate) {
      setDayContext(null)
      return
    }
    let cancelled = false
    async function loadContext() {
      const dow = isoDayOfWeek(fromLocalISO(eventDate))
      const [
        { data: courses },
        { data: exceptions },
        { data: otherEvents },
        { data: recurringEvents },
        { data: allProjects },
        { data: settings },
        { data: habits },
        { data: readingPlans },
        { data: hafalanPlans },
        { data: tasks },
      ] = await Promise.all([
        activeSemester
          ? supabase.from('courses').select('*').eq('semester_id', activeSemester.id).eq('day_of_week', dow)
          : Promise.resolve({ data: [] }),
        supabase.from('schedule_exceptions').select('*').eq('exception_date', eventDate),
        supabase.from('events').select('*').eq('event_date', eventDate),
        supabase.from('recurring_events').select('*'),
        supabase.from('projects').select('*').eq('status', 'active'),
        supabase.from('user_settings').select('*').maybeSingle(),
        supabase.from('habits').select('est_duration_min'),
        supabase.from('reading_plans').select('total_units, current_position, est_duration_min'),
        supabase.from('hafalan_plans').select('total_units, current_position, est_duration_min'),
        supabase.from('tasks').select('status, planned_for, due_date, est_duration_min'),
      ])
      if (cancelled) return
      setDayContext({
        dow,
        courses: courses ?? [],
        exceptions: exceptions ?? [],
        otherEvents: (otherEvents ?? []).filter((e) => e.id !== event?.id),
        recurringEvents: recurringEvents ?? [],
        projects: allProjects ?? [],
        settings,
        habits: habits ?? [],
        readingPlans: readingPlans ?? [],
        hafalanPlans: hafalanPlans ?? [],
        tasks: tasks ?? [],
      })
    }
    loadContext()
    return () => {
      cancelled = true
    }
  }, [eventDate, activeSemester, event?.id])

  const conflicts = useMemo(() => {
    if (!dayContext || allDay || !startTime || !endTime) return []
    const eventStart = timeToMinutes(startTime)
    const eventEnd = timeToMinutes(endTime)
    if (eventStart == null || eventEnd == null) return []
    return resolveCoursesForDate(dayContext.courses, dayContext.exceptions, dayContext.dow, eventDate).filter(
      (r) => overlapMinutes(eventStart, eventEnd, r.startMin, r.endMin) > 0,
    )
  }, [dayContext, allDay, startTime, endTime, eventDate])

  const impact = useMemo(() => {
    if (!dayContext) return null
    const isDayOff = dayContext.dow === (dayContext.settings?.day_off_of_week ?? 7)
    const baseFree = computeFreeMinutes({
      dateISO: eventDate,
      dow: dayContext.dow,
      sleepHours: dayContext.settings?.sleep_hours,
      courses: dayContext.courses,
      exceptions: dayContext.exceptions,
      recurringEvents: dayContext.recurringEvents,
      events: dayContext.otherEvents,
      projects: dayContext.projects,
    }).free

    const eventMin =
      !allDay && startTime && endTime ? Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime)) : 0
    const afterFree = baseFree - eventMin

    const rencana = computeTotalRencana({
      habits: dayContext.habits,
      readingPlans: dayContext.readingPlans,
      hafalanPlans: dayContext.hafalanPlans,
      tasks: dayContext.tasks,
      dateISO: eventDate,
      isDayOff,
    })

    return { baseFree, afterFree, rencana, wasOver: rencana > baseFree, willBeOver: rencana > afterFree }
  }, [dayContext, allDay, startTime, endTime, eventDate])

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
      project_id: projectId || null,
      note: note || null,
    }

    const { error } = isEdit
      ? await supabase.from('events').update(payload).eq('id', event.id)
      : await supabase.from('events').insert(payload)

    if (error) {
      setBusy(false)
      setError(error.message)
      return
    }

    if (conflictChoice === 'skip_class' && conflicts.length > 0) {
      for (const c of conflicts) {
        const { data: existing } = await supabase
          .from('schedule_exceptions')
          .select('id')
          .eq('course_id', c.course.id)
          .eq('exception_date', eventDate)
          .maybeSingle()
        if (!existing) {
          await supabase.from('schedule_exceptions').insert({
            course_id: c.course.id,
            exception_date: eventDate,
            type: 'cancelled',
            note: `Otomatis: bentrok dengan event "${title.trim()}"`,
          })
        }
      }
    }

    setBusy(false)
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

      {conflicts.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
            <AlertTriangle size={15} /> Bentrok jadwal kuliah
          </p>
          <p className="mt-1 text-xs text-amber-700">
            {conflicts.map((c) => `${c.course.name} (${c.course.start_time?.slice(0, 5)}–${c.course.end_time?.slice(0, 5)})`).join(', ')}
          </p>
          <div className="mt-2 space-y-1.5 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="conflict"
                checked={conflictChoice === 'prioritize'}
                onChange={() => setConflictChoice('prioritize')}
              />
              Event diprioritaskan (kuliah tetap ada di jadwal, hari itu numpuk)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="conflict"
                checked={conflictChoice === 'skip_class'}
                onChange={() => setConflictChoice('skip_class')}
              />
              Lewati kelas (kuliah dibatalkan otomatis untuk tanggal ini)
            </label>
          </div>
        </div>
      )}

      {impact && (
        <div
          className={`rounded-lg border p-3 text-xs ${
            impact.willBeOver && !impact.wasOver
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          {allDay ? (
            <p>Event sepanjang hari — durasi tak terhitung otomatis dalam anggaran waktu, tapi tetap tercatat di jadwal.</p>
          ) : impact.willBeOver && !impact.wasOver ? (
            <p>
              ⚠️ Event ini akan membuat waktu luang tanggal itu tinggal {minutesToLabel(impact.afterFree)} — rencana
              rohani/kebiasaan hari itu berpotensi turun ke set lantai.
            </p>
          ) : impact.willBeOver ? (
            <p>⚠️ Tanggal itu sudah padat (set lantai aktif) sebelum event ini; waktu luang akan tinggal {minutesToLabel(impact.afterFree)}.</p>
          ) : (
            <p>Waktu luang tanggal itu setelah event ini: {minutesToLabel(impact.afterFree)}. Masih muat.</p>
          )}
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
