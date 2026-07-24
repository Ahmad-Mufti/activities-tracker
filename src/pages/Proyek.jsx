import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import Modal from '../components/Modal'
import ProjectForm from '../components/ProjectForm'
import { todayLocalISO } from '../lib/dates'
import { getWeekBounds, computeProjectWeeklyConsumedMinutes, minutesToLabel } from '../lib/timeBudget'

const STATUS_LABEL = { active: 'Aktif', done: 'Selesai', archived: 'Diarsipkan' }
const STATUS_COLOR = {
  active: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
}

export default function Proyek() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const today = todayLocalISO()
  const [projects, setProjects] = useState([])
  const [events, setEvents] = useState([])
  const [recurringEvents, setRecurringEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProject, setEditingProject] = useState(null) // null = tertutup, {} = baru, {...} = edit

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { weekStart, weekEnd } = getWeekBounds(today)
    const [{ data: projectData }, { data: eventData }, { data: recurringData }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('events').select('*').gte('event_date', weekStart).lte('event_date', weekEnd),
      supabase.from('recurring_events').select('*'),
    ])
    setProjects(projectData ?? [])
    setEvents(eventData ?? [])
    setRecurringEvents(recurringData ?? [])
    setLoading(false)
  }, [today])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!user) return
    const tables = ['projects', 'events', 'recurring_events']
    const channels = tables.map((table) =>
      supabase
        .channel(`proyek-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` }, fetchAll)
        .subscribe(),
    )
    return () => channels.forEach((c) => supabase.removeChannel(c))
  }, [user, fetchAll])

  async function handleDelete(project) {
    const ok = await confirm({
      title: 'Hapus proyek?',
      message: `Hapus proyek "${project.name}"? Tugas/event yang menempel tidak ikut terhapus, tautannya saja yang lepas.`,
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (error) alert(error.message)
  }

  if (loading) {
    return <p className="text-gray-400">Memuat...</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">Proyek</h1>
        <button
          onClick={() => setEditingProject({})}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Tambah Proyek
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {projects.length === 0 && <p className="text-gray-400">Belum ada proyek.</p>}
        {projects.map((p) => {
          const { weekStart, weekEnd } = getWeekBounds(today)
          const consumedMin =
            p.weekly_hours != null
              ? computeProjectWeeklyConsumedMinutes(p.id, events, recurringEvents, weekStart, weekEnd)
              : 0
          const totalMin = Number(p.weekly_hours ?? 0) * 60
          const sisaMin = Math.max(0, totalMin - consumedMin)

          return (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FolderKanban size={18} className="text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-800">{p.name}</p>
                    {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingProject(p)} title="Edit" className="text-blue-600 hover:text-blue-700">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(p)} title="Hapus" className="text-red-600 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 ${STATUS_COLOR[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                {p.deadline && (
                  <span className="text-gray-400">
                    Deadline: {new Date(p.deadline).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </span>
                )}
              </div>

              {p.weekly_hours != null && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="text-gray-700">
                    Beban minggu ini: {minutesToLabel(consumedMin)} terpakai dari {p.weekly_hours} jam/minggu
                  </p>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${consumedMin > totalMin ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${totalMin > 0 ? Math.min(100, (consumedMin / totalMin) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Sisa {minutesToLabel(sisaMin)} dibagi rata ke hari-hari tersisa pekan ini — mengurangi waktu
                    luang harian tanpa hitung-ganda dengan event/kegiatan rutin ber-proyek ini.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editingProject !== null && (
        <Modal title={editingProject.id ? 'Edit Proyek' : 'Tambah Proyek'} onClose={() => setEditingProject(null)}>
          <ProjectForm project={editingProject} onDone={() => setEditingProject(null)} />
        </Modal>
      )}
    </div>
  )
}
