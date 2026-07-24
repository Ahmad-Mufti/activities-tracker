import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Settings, LayoutGrid, Repeat } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useSemesters } from '../context/SemesterContext'
import { useConfirm } from '../context/ConfirmContext'
import Modal from '../components/Modal'
import CourseForm from '../components/CourseForm'
import SemesterManager from '../components/SemesterManager'
import RecurringEventForm from '../components/RecurringEventForm'
import { DAYS } from '../lib/days'

const COLUMN_OPTIONS = [1, 2, 3, 4, 7]
const COLUMNS_STORAGE_KEY = 'kampusku:jadwal-columns'
const GAP_REM = 0.75 // samakan dengan kelas Tailwind gap-3 di kontainer

function getInitialColumns() {
  const saved = Number(localStorage.getItem(COLUMNS_STORAGE_KEY))
  if (COLUMN_OPTIONS.includes(saved)) return saved
  return window.innerWidth < 768 ? 1 : 7
}

export default function Jadwal() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const { semesters, activeSemester, loading: loadingSemesters, setActive } = useSemesters()
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [showSemesterManager, setShowSemesterManager] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null) // null = tertutup, {} = baru, {...} = edit
  const [columns, setColumns] = useState(getInitialColumns)
  const [recurringEvents, setRecurringEvents] = useState([])
  const [projects, setProjects] = useState([])
  const [editingRecurring, setEditingRecurring] = useState(null) // null = tertutup, {} = baru, {...} = edit

  function handleColumnsChange(n) {
    setColumns(n)
    localStorage.setItem(COLUMNS_STORAGE_KEY, String(n))
  }

  const fetchCourses = useCallback(async () => {
    if (!activeSemester) {
      setCourses([])
      setLoadingCourses(false)
      return
    }
    setLoadingCourses(true)
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('semester_id', activeSemester.id)
      .order('start_time', { ascending: true })
    if (!error) setCourses(data)
    setLoadingCourses(false)
  }, [activeSemester])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('courses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses', filter: `user_id=eq.${user.id}` },
        fetchCourses,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchCourses])

  async function handleDeleteCourse(course) {
    const ok = await confirm({
      title: 'Hapus mata kuliah?',
      message: `Hapus mata kuliah "${course.name}"?`,
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('courses').delete().eq('id', course.id)
    if (error) alert(error.message)
  }

  const fetchRecurringEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('recurring_events')
      .select('*, projects(name)')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })
    if (!error) setRecurringEvents(data)
  }, [])

  useEffect(() => {
    fetchRecurringEvents()
    supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'active')
      .then(({ data, error }) => {
        if (!error) setProjects(data)
      })
  }, [fetchRecurringEvents])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('recurring-events-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recurring_events', filter: `user_id=eq.${user.id}` },
        fetchRecurringEvents,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchRecurringEvents])

  const recurringByDay = useMemo(() => {
    const map = new Map()
    for (const r of recurringEvents) {
      if (!map.has(r.day_of_week)) map.set(r.day_of_week, [])
      map.get(r.day_of_week).push(r)
    }
    return map
  }, [recurringEvents])

  async function handleDeleteRecurring(item) {
    const ok = await confirm({
      title: 'Hapus kegiatan rutin?',
      message: `Hapus kegiatan rutin "${item.title}"?`,
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('recurring_events').delete().eq('id', item.id)
    if (error) alert(error.message)
  }

  if (loadingSemesters) {
    return <p className="text-gray-400">Memuat...</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">Jadwal</h1>
        {semesters.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={activeSemester?.id ?? ''}
              onChange={(e) => setActive(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              {!activeSemester && <option value="">Pilih semester</option>}
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowSemesterManager(true)}
              title="Kelola semester"
              className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <Settings size={18} />
            </button>
          </div>
        )}
      </div>

      {semesters.length === 0 ? (
        <div className="mt-4">
          <p className="text-gray-500">Belum ada semester. Buat semester dulu supaya bisa mengisi jadwal.</p>
          <button
            onClick={() => setShowSemesterManager(true)}
            className="mt-3 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} /> Buat Semester
          </button>
        </div>
      ) : !activeSemester ? (
        <p className="mt-4 text-gray-500">Belum ada semester aktif. Pilih salah satu di atas.</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <LayoutGrid size={16} className="text-gray-400" />
              <div className="flex items-center gap-1 rounded-lg border border-gray-300 p-1">
                {COLUMN_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => handleColumnsChange(n)}
                    title={`${n} kolom per baris`}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      columns === n ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setEditingCourse({})}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} /> Tambah Mata Kuliah
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {DAYS.map((day) => (
              <div
                key={day.value}
                className="rounded-xl border border-gray-200 bg-white p-3"
                style={{ flex: `1 1 calc((100% - ${(columns - 1) * GAP_REM}rem) / ${columns})`, minWidth: 0 }}
              >
                <h3 className="mb-2 text-sm font-semibold text-gray-600">{day.label}</h3>
                <div className="space-y-2">
                  {loadingCourses && <p className="text-xs text-gray-400">Memuat...</p>}
                  {!loadingCourses &&
                    courses
                      .filter((c) => c.day_of_week === day.value)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg border-l-4 bg-gray-50 p-2 text-xs"
                          style={{ borderLeftColor: c.color }}
                        >
                          <p className="font-medium text-gray-800">{c.name}</p>
                          <p className="text-gray-500">
                            {c.start_time?.slice(0, 5)}–{c.end_time?.slice(0, 5)}
                          </p>
                          {c.room && <p className="text-gray-500">{c.room}</p>}
                          {c.lecturer && <p className="text-gray-500">{c.lecturer}</p>}
                          <div className="mt-1 flex gap-2">
                            <button onClick={() => setEditingCourse(c)} title="Edit" className="text-blue-600 hover:underline">
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c)}
                              title="Hapus"
                              className="text-red-600 hover:underline"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                  {!loadingCourses && courses.filter((c) => c.day_of_week === day.value).length === 0 && (
                    <p className="text-xs text-gray-300">-</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Repeat size={16} /> Kegiatan Rutin Mingguan (non-kuliah)
          </h2>
          <button
            onClick={() => setEditingRecurring({})}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus size={14} /> Tambah Kegiatan Rutin
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {recurringEvents.length === 0 && (
            <p className="text-sm text-gray-400">
              Belum ada kegiatan rutin (mis. rapat organisasi mingguan). Item ini berdiri sendiri, tidak terikat semester.
            </p>
          )}
          {DAYS.filter((day) => recurringByDay.has(day.value)).map((day) => (
            <div key={day.value}>
              <p className="text-xs font-semibold text-gray-500">{day.label}</p>
              <div className="mt-1 space-y-1.5">
                {recurringByDay.get(day.value).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-lg border-l-4 bg-gray-50 p-2 text-sm"
                    style={{ borderLeftColor: r.color }}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{r.title}</p>
                      <p className="text-xs text-gray-500">
                        {r.start_time?.slice(0, 5) ?? '--:--'}–{r.end_time?.slice(0, 5) ?? '--:--'}
                        {r.category && ` · ${r.category}`}
                        {r.projects?.name && ` · ${r.projects.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingRecurring(r)} title="Edit" className="text-blue-600 hover:text-blue-700">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeleteRecurring(r)} title="Hapus" className="text-red-600 hover:text-red-700">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingRecurring !== null && (
        <Modal
          title={editingRecurring.id ? 'Edit Kegiatan Rutin' : 'Tambah Kegiatan Rutin'}
          onClose={() => setEditingRecurring(null)}
        >
          <RecurringEventForm item={editingRecurring} projects={projects} onDone={() => setEditingRecurring(null)} />
        </Modal>
      )}

      {editingCourse !== null && activeSemester && (
        <Modal
          title={editingCourse.id ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}
          onClose={() => setEditingCourse(null)}
        >
          <CourseForm course={editingCourse} semesterId={activeSemester.id} onDone={() => setEditingCourse(null)} />
        </Modal>
      )}

      {showSemesterManager && (
        <Modal title="Kelola Semester" onClose={() => setShowSemesterManager(false)}>
          <SemesterManager />
        </Modal>
      )}
    </div>
  )
}
