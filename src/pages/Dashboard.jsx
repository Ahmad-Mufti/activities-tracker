import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ListTodo, Repeat, RotateCcw, MapPin, Clock, Sunrise, CalendarClock, Gauge, AlertTriangle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useSemesters } from '../context/SemesterContext'
import { todayLocalISO, addDays, isoDayOfWeek } from '../lib/dates'
import { computePrayerTimes, getNextPrayer, computeSlotBoundaries, formatTime, PRAYER_LABELS, PRAYER_ORDER } from '../lib/prayerTimes'
import {
  getWeekBounds,
  computeFreeMinutes,
  computeTotalRencana,
  computeSlotUsage,
  minutesToLabel,
} from '../lib/timeBudget'
import { floorModeDisplay } from '../lib/priority'
import NotificationPermissionCard from '../components/NotificationPermissionCard'

export default function Dashboard() {
  const { user } = useAuth()
  const { activeSemester } = useSemesters()
  const today = todayLocalISO()
  const todayDow = isoDayOfWeek(new Date())

  const [loading, setLoading] = useState(true)
  const [todayCourses, setTodayCourses] = useState([])
  const [todayEvents, setTodayEvents] = useState([])
  const [dueTasks, setDueTasks] = useState([])
  const [uncheckedHabits, setUncheckedHabits] = useState([])
  const [hafalanToday, setHafalanToday] = useState([])
  const [murajaUnits, setMurajaUnits] = useState([])
  const [murajaTotal, setMurajaTotal] = useState(0)
  const [settings, setSettings] = useState(null)
  const [scheduleExceptions, setScheduleExceptions] = useState([])
  const [budget, setBudget] = useState(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const hasLocation = settings?.latitude != null && settings?.longitude != null
  const prayerTimes = useMemo(() => {
    if (!hasLocation) return null
    return computePrayerTimes({ latitude: settings.latitude, longitude: settings.longitude, calcMethod: settings.calc_method })
  }, [hasLocation, settings])
  const nextPrayer = useMemo(() => {
    if (!hasLocation) return null
    return getNextPrayer({ latitude: settings.latitude, longitude: settings.longitude, calcMethod: settings.calc_method }, now)
  }, [hasLocation, settings, now])

  const fetchDashboard = useCallback(async () => {
    setLoading(true)

    let courses = []
    if (activeSemester) {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('semester_id', activeSemester.id)
        .eq('day_of_week', todayDow)
        .order('start_time', { ascending: true })
      courses = data ?? []
    }
    setTodayCourses(courses)

    const { data: exceptions } = await supabase.from('schedule_exceptions').select('*').eq('exception_date', today)
    setScheduleExceptions(exceptions ?? [])

    const { weekStart, weekEnd } = getWeekBounds(today)
    const { data: weekEvents } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', weekStart)
      .lte('event_date', weekEnd)
    const events = (weekEvents ?? []).filter((e) => e.event_date === today)
    setTodayEvents([...events].sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? '')))

    const { data: recurringEvents } = await supabase.from('recurring_events').select('*')
    const { data: projects } = await supabase.from('projects').select('*').eq('status', 'active')
    const { data: readingPlans } = await supabase.from('reading_plans').select('*')

    const startOfToday = new Date(`${today}T00:00:00`).toISOString()
    const startOfDayAfterTomorrow = new Date(`${addDays(today, 2)}T00:00:00`).toISOString()
    const { data: dueByDate } = await supabase
      .from('tasks')
      .select('*, courses(name)')
      .neq('status', 'done')
      .gte('due_date', startOfToday)
      .lt('due_date', startOfDayAfterTomorrow)
      .order('due_date', { ascending: true })
    const { data: planned } = await supabase
      .from('tasks')
      .select('*, courses(name)')
      .neq('status', 'done')
      .eq('planned_for', today)
    const merged = new Map()
    ;(planned ?? []).forEach((t) => merged.set(t.id, { ...t, plannedToday: true }))
    ;(dueByDate ?? []).forEach((t) => merged.set(t.id, { ...merged.get(t.id), ...t, dueSoon: true }))
    const tasksToday = Array.from(merged.values())
    setDueTasks(tasksToday)

    const { data: habits } = await supabase.from('habits').select('*')
    const { data: logsToday } = await supabase.from('habit_logs').select('habit_id').eq('log_date', today)
    const loggedIds = new Set((logsToday ?? []).map((l) => l.habit_id))
    setUncheckedHabits((habits ?? []).filter((h) => !loggedIds.has(h.id)))

    const { data: settingsRow } = await supabase.from('user_settings').select('*').maybeSingle()
    setSettings(settingsRow)
    const dayOff = settingsRow?.day_off_of_week ?? 7
    const cap = settingsRow?.muraja_daily_cap ?? 15
    const isDayOff = todayDow === dayOff

    const { data: hafalanPlans } = await supabase.from('hafalan_plans').select('*')
    const activeHafalan = (hafalanPlans ?? []).filter((p) => p.total_units == null || p.current_position < p.total_units)
    setHafalanToday(isDayOff ? [] : activeHafalan)

    const { data: muraja, count } = await supabase
      .from('hafalan_units')
      .select('*, hafalan_plans(name)', { count: 'exact' })
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true })
      .order('memorized_date', { ascending: true })
      .limit(cap)
    setMurajaUnits(muraja ?? [])
    setMurajaTotal(count ?? 0)

    // Anggaran waktu (6C): waktu_luang vs total_rencana + pengecekan per-slot.
    const { free } = computeFreeMinutes({
      dateISO: today,
      dow: todayDow,
      sleepHours: settingsRow?.sleep_hours,
      courses,
      exceptions: exceptions ?? [],
      recurringEvents: recurringEvents ?? [],
      events,
      projects: projects ?? [],
    })
    const rencana = computeTotalRencana({
      habits: habits ?? [],
      readingPlans: readingPlans ?? [],
      hafalanPlans: activeHafalan,
      tasks: tasksToday,
      dateISO: today,
      isDayOff,
    })
    let slots = []
    if (settingsRow?.latitude != null && settingsRow?.longitude != null) {
      const slotBoundaries = computeSlotBoundaries({
        latitude: settingsRow.latitude,
        longitude: settingsRow.longitude,
        calcMethod: settingsRow.calc_method,
        sleepHours: settingsRow.sleep_hours,
      })
      const items = [...(habits ?? []), ...readingPlans, ...activeHafalan, ...tasksToday]
      slots = computeSlotUsage({ slotBoundaries, courses, exceptions: exceptions ?? [], dow: todayDow, dateISO: today, events, items })
    }
    setBudget({ free, rencana, slots, floorModeActive: rencana > free })

    setLoading(false)
  }, [activeSemester, today, todayDow])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    if (!user) return
    const tables = [
      'courses',
      'events',
      'tasks',
      'habits',
      'habit_logs',
      'hafalan_plans',
      'hafalan_units',
      'user_settings',
      'recurring_events',
      'projects',
      'reading_plans',
      'schedule_exceptions',
    ]
    const channels = tables.map((table) =>
      supabase
        .channel(`dashboard-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` },
          fetchDashboard,
        )
        .subscribe(),
    )
    return () => channels.forEach((c) => supabase.removeChannel(c))
  }, [user, fetchDashboard])

  const todayLabel = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (loading) {
    return <p className="text-gray-400">Memuat...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">{todayLabel}</p>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
        <Link to="/rohani" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
          <Sunrise size={16} /> Jadwal Sholat Hari Ini
        </Link>
        {!hasLocation ? (
          <p className="mt-2 text-sm text-gray-400">
            Lokasi belum diatur.{' '}
            <Link to="/rohani" className="text-blue-600 hover:underline">
              Atur lokasi di Pengaturan
            </Link>{' '}
            untuk melihat jadwal sholat.
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
              {PRAYER_ORDER.map((key) => (
                <div
                  key={key}
                  className={`rounded-lg p-2 ${nextPrayer?.key === key ? 'bg-blue-50 ring-1 ring-blue-300' : 'bg-gray-50'}`}
                >
                  <p className="text-[11px] text-gray-400">{PRAYER_LABELS[key]}</p>
                  <p className="text-sm font-semibold text-gray-800">{formatTime(prayerTimes?.[key])}</p>
                </div>
              ))}
            </div>
            {nextPrayer && (
              <p className="mt-2 flex items-center gap-1 text-xs text-blue-700">
                <CalendarClock size={12} /> Berikutnya: {nextPrayer.label} pukul {formatTime(nextPrayer.time)}
              </p>
            )}
          </>
        )}
      </section>

      {budget && (
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Gauge size={16} /> Anggaran Waktu Hari Ini
          </p>
          {budget.floorModeActive && (
            <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-700">
              <AlertTriangle size={14} /> Hari ini padat — mode Set Lantai aktif. Bonus disembunyikan, Rutin
              ditunda; muraja'ah & lantai baca tetap diutamakan.
            </p>
          )}
          <p className="mt-2 text-sm text-gray-600">
            Waktu luang: <span className="font-medium text-gray-800">{minutesToLabel(budget.free)}</span> · Rencana
            hari ini: <span className="font-medium text-gray-800">{minutesToLabel(budget.rencana)}</span>
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-2 rounded-full ${budget.floorModeActive ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${budget.free > 0 ? Math.min(100, (budget.rencana / budget.free) * 100) : 100}%` }}
            />
          </div>
          {budget.slots.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {budget.slots.map((s) => (
                <div key={s.key} className={`rounded-lg p-1.5 text-center ${s.overloaded ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                  <p className={`text-[11px] font-medium ${s.overloaded ? 'text-red-600' : 'text-gray-700'}`}>
                    {minutesToLabel(s.usedMin)}/{minutesToLabel(s.capacityMin)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-4">
        <NotificationPermissionCard />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <Link to="/jadwal" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
            <Calendar size={16} /> Jadwal & Event Hari Ini
          </Link>
          <div className="mt-3 space-y-2">
            {todayCourses.length === 0 && todayEvents.length === 0 && (
              <p className="text-sm text-gray-400">Tidak ada jadwal kuliah atau event hari ini.</p>
            )}
            {todayCourses.map((c) => {
              const ex = scheduleExceptions.find((e) => e.course_id === c.id)
              const cancelled = ex?.type === 'cancelled'
              const start = ex?.type === 'moved' ? ex.new_start_time : c.start_time
              const end = ex?.type === 'moved' ? ex.new_end_time : c.end_time
              return (
                <div
                  key={c.id}
                  className={`rounded-lg border-l-4 bg-gray-50 p-2 text-sm ${cancelled ? 'opacity-50' : ''}`}
                  style={{ borderLeftColor: c.color }}
                >
                  <p className={`font-medium text-gray-800 ${cancelled ? 'line-through' : ''}`}>{c.name}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} /> {start?.slice(0, 5)}–{end?.slice(0, 5)}
                    {c.room && !cancelled && (
                      <>
                        <MapPin size={12} className="ml-2" /> {c.room}
                      </>
                    )}
                    {cancelled && <span className="ml-1 text-red-500">Dibatalkan hari ini</span>}
                    {ex?.type === 'moved' && <span className="ml-1 text-blue-500">Dipindah</span>}
                  </p>
                </div>
              )
            })}
            {todayEvents.map((ev) => (
              <div key={ev.id} className="rounded-lg border-l-4 border-purple-400 bg-gray-50 p-2 text-sm">
                <p className="font-medium text-gray-800">{ev.title}</p>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} />{' '}
                  {ev.all_day ? 'Sepanjang hari' : `${ev.start_time?.slice(0, 5) ?? '--:--'}–${ev.end_time?.slice(0, 5) ?? '--:--'}`}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <Link to="/tugas" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
            <ListTodo size={16} /> Tugas Hari Ini & Deadline Dekat
          </Link>
          <div className="mt-3 space-y-2">
            {dueTasks.length === 0 && <p className="text-sm text-gray-400">Tidak ada tugas direncanakan/jatuh tempo dekat.</p>}
            {dueTasks.map((t) => (
              <div key={t.id} className="rounded-lg bg-gray-50 p-2 text-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-medium text-gray-800">{t.title}</p>
                  {t.plannedToday && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                      Rencana hari ini
                    </span>
                  )}
                  {t.dueSoon && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      Deadline dekat
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {t.due_date &&
                    new Date(t.due_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  {t.courses?.name && ` · ${t.courses.name}`}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <Link to="/kebiasaan" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
            <Repeat size={16} /> Kebiasaan Belum Dicentang
          </Link>
          <div className="mt-3 space-y-2">
            {(() => {
              const visibleHabits = uncheckedHabits.filter(
                (h) => floorModeDisplay(h, budget?.floorModeActive ?? false).visible,
              )
              if (visibleHabits.length === 0) {
                return (
                  <p className="text-sm text-gray-400">
                    {uncheckedHabits.length === 0
                      ? 'Semua kebiasaan sudah dicentang hari ini. 🎉'
                      : 'Kebiasaan Bonus disembunyikan dulu (mode lantai hari sibuk).'}
                  </p>
                )
              }
              return visibleHabits.map((h) => {
                const display = floorModeDisplay(h, budget?.floorModeActive ?? false)
                return (
                  <div key={h.id} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: h.color }} />
                    {h.name}
                    {display.deferred && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        ditunda hari ini
                      </span>
                    )}
                  </div>
                )
              })
            })()}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <Link to="/rohani" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
            <RotateCcw size={16} /> Rohani
          </Link>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500">Setoran hafalan hari ini</p>
              {hafalanToday.length === 0 ? (
                <p className="text-sm text-gray-400">Tidak ada setoran hari ini.</p>
              ) : budget?.floorModeActive ? (
                <p className="mt-1 text-sm text-amber-700">
                  Setoran hafalan baru ditunda hari ini (mode lantai) — muraja'ah tetap prioritas.
                </p>
              ) : (
                <div className="mt-1 space-y-1">
                  {hafalanToday.map((p) => {
                    const from = p.current_position + 1
                    const to = Math.min(p.current_position + p.daily_pace, p.total_units)
                    return (
                      <p key={p.id} className="text-sm text-gray-700">
                        <span className="font-medium">{p.name}</span>: {p.unit_label} ke-{from}
                        {to !== from && ` sampai ke-${to}`}
                      </p>
                    )
                  })}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Muraja'ah hari ini ({murajaTotal})</p>
              {murajaUnits.length === 0 ? (
                <p className="text-sm text-gray-400">Tidak ada muraja'ah jatuh tempo hari ini. 🎉</p>
              ) : (
                <div className="mt-1 space-y-1">
                  {murajaUnits.map((u) => (
                    <p key={u.id} className="text-sm text-gray-700">
                      <span className="font-medium">{u.unit_ref}</span>
                      <span className="text-xs text-gray-400"> · {u.hafalan_plans?.name}</span>
                    </p>
                  ))}
                  {murajaTotal > murajaUnits.length && (
                    <p className="text-xs text-gray-400">+{murajaTotal - murajaUnits.length} lagi, terus muncul besok.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
