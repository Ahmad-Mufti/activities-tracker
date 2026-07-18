import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ListTodo, Repeat, RotateCcw, MapPin, Clock } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useSemesters } from '../context/SemesterContext'
import { todayLocalISO, addDays, isoDayOfWeek } from '../lib/dates'
import NotificationPermissionCard from '../components/NotificationPermissionCard'

export default function Dashboard() {
  const { user } = useAuth()
  const { activeSemester } = useSemesters()
  const today = todayLocalISO()
  const todayDow = isoDayOfWeek(new Date())

  const [loading, setLoading] = useState(true)
  const [todayCourses, setTodayCourses] = useState([])
  const [dueTasks, setDueTasks] = useState([])
  const [uncheckedHabits, setUncheckedHabits] = useState([])
  const [hafalanToday, setHafalanToday] = useState([])
  const [murajaCount, setMurajaCount] = useState(0)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)

    if (activeSemester) {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('semester_id', activeSemester.id)
        .eq('day_of_week', todayDow)
        .order('start_time', { ascending: true })
      setTodayCourses(data ?? [])
    } else {
      setTodayCourses([])
    }

    const startOfToday = new Date(`${today}T00:00:00`).toISOString()
    const startOfDayAfterTomorrow = new Date(`${addDays(today, 2)}T00:00:00`).toISOString()
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*, courses(name)')
      .neq('status', 'done')
      .gte('due_date', startOfToday)
      .lt('due_date', startOfDayAfterTomorrow)
      .order('due_date', { ascending: true })
    setDueTasks(tasks ?? [])

    const { data: habits } = await supabase.from('habits').select('*')
    const { data: logsToday } = await supabase.from('habit_logs').select('habit_id').eq('log_date', today)
    const loggedIds = new Set((logsToday ?? []).map((l) => l.habit_id))
    setUncheckedHabits((habits ?? []).filter((h) => !loggedIds.has(h.id)))

    const { data: settings } = await supabase.from('user_settings').select('*').maybeSingle()
    const dayOff = settings?.day_off_of_week ?? 7

    if (todayDow !== dayOff) {
      const { data: hafalanPlans } = await supabase.from('hafalan_plans').select('*')
      setHafalanToday((hafalanPlans ?? []).filter((p) => p.current_position < p.total_units))
    } else {
      setHafalanToday([])
    }

    const { count } = await supabase
      .from('hafalan_units')
      .select('*', { count: 'exact', head: true })
      .lte('next_review_date', today)
    setMurajaCount(count ?? 0)

    setLoading(false)
  }, [activeSemester, today, todayDow])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    if (!user) return
    const tables = ['courses', 'tasks', 'habits', 'habit_logs', 'hafalan_plans', 'hafalan_units', 'user_settings']
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

      <div className="mt-4">
        <NotificationPermissionCard />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <Link to="/jadwal" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
            <Calendar size={16} /> Jadwal Hari Ini
          </Link>
          <div className="mt-3 space-y-2">
            {todayCourses.length === 0 && <p className="text-sm text-gray-400">Tidak ada jadwal kuliah hari ini.</p>}
            {todayCourses.map((c) => (
              <div key={c.id} className="rounded-lg border-l-4 bg-gray-50 p-2 text-sm" style={{ borderLeftColor: c.color }}>
                <p className="font-medium text-gray-800">{c.name}</p>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} /> {c.start_time?.slice(0, 5)}–{c.end_time?.slice(0, 5)}
                  {c.room && (
                    <>
                      <MapPin size={12} className="ml-2" /> {c.room}
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <Link to="/tugas" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
            <ListTodo size={16} /> Tugas Jatuh Tempo Hari/Besok
          </Link>
          <div className="mt-3 space-y-2">
            {dueTasks.length === 0 && <p className="text-sm text-gray-400">Tidak ada tugas jatuh tempo dekat.</p>}
            {dueTasks.map((t) => (
              <div key={t.id} className="rounded-lg bg-gray-50 p-2 text-sm">
                <p className="font-medium text-gray-800">{t.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(t.due_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
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
            {uncheckedHabits.length === 0 && (
              <p className="text-sm text-gray-400">Semua kebiasaan sudah dicentang hari ini. 🎉</p>
            )}
            {uncheckedHabits.map((h) => (
              <div key={h.id} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-sm">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: h.color }} />
                {h.name}
              </div>
            ))}
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
              <p className="text-xs font-medium text-gray-500">Pengingat muraja'ah</p>
              <p className="text-sm text-gray-700">
                {murajaCount === 0 ? "Tidak ada muraja'ah jatuh tempo hari ini." : `${murajaCount} unit menunggu diulang.`}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
