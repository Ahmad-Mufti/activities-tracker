import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Circle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useSemesters } from '../context/SemesterContext'
import Modal from '../components/Modal'
import TaskForm from '../components/TaskForm'

const STATUS_LABEL = { todo: 'Belum', doing: 'Dikerjakan', done: 'Selesai' }
const PRIORITY_LABEL = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi' }
const PRIORITY_COLOR = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

export default function Tugas() {
  const { user } = useAuth()
  const { activeSemester } = useSemesters()
  const [tasks, setTasks] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [editingTask, setEditingTask] = useState(null) // null = tertutup, {} = baru, {...} = edit

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*, courses(name)')
      .order('due_date', { ascending: true, nullsFirst: false })
    if (!error) setTasks(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        fetchTasks,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchTasks])

  useEffect(() => {
    if (!activeSemester) {
      setCourses([])
      return
    }
    supabase
      .from('courses')
      .select('id, name')
      .eq('semester_id', activeSemester.id)
      .then(({ data, error }) => {
        if (!error) setCourses(data)
      })
  }, [activeSemester])

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      return true
    })
  }, [tasks, statusFilter, priorityFilter])

  async function toggleDone(task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    if (error) alert(error.message)
  }

  async function handleDelete(task) {
    if (!window.confirm(`Hapus tugas "${task.title}"?`)) return
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) alert(error.message)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">Tugas</h1>
        <button
          onClick={() => setEditingTask({})}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Tambah Tugas
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">Semua Status</option>
          <option value="todo">Belum</option>
          <option value="doing">Dikerjakan</option>
          <option value="done">Selesai</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">Semua Prioritas</option>
          <option value="low">Rendah</option>
          <option value="medium">Sedang</option>
          <option value="high">Tinggi</option>
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {loading && <p className="text-gray-400">Memuat...</p>}
        {!loading && filteredTasks.length === 0 && <p className="text-gray-400">Tidak ada tugas.</p>}
        {filteredTasks.map((task) => (
          <div key={task.id} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3">
            <button
              onClick={() => toggleDone(task)}
              title={task.status === 'done' ? 'Tandai belum selesai' : 'Tandai selesai'}
              className="mt-0.5 text-gray-400 hover:text-green-600"
            >
              {task.status === 'done' ? <CheckCircle2 size={20} className="text-green-600" /> : <Circle size={20} />}
            </button>
            <div className="flex-1">
              <p className={`font-medium ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {task.title}
              </p>
              {task.description && <p className="text-sm text-gray-500">{task.description}</p>}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 ${PRIORITY_COLOR[task.priority]}`}>
                  {PRIORITY_LABEL[task.priority]}
                </span>
                <span className="text-gray-400">{STATUS_LABEL[task.status]}</span>
                {task.due_date && (
                  <span className="text-gray-400">
                    Jatuh tempo:{' '}
                    {new Date(task.due_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                )}
                {task.courses?.name && <span className="text-gray-400">· {task.courses.name}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditingTask(task)} title="Edit" className="text-blue-600 hover:text-blue-700">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(task)} title="Hapus" className="text-red-600 hover:text-red-700">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingTask !== null && (
        <Modal title={editingTask.id ? 'Edit Tugas' : 'Tambah Tugas'} onClose={() => setEditingTask(null)}>
          <TaskForm task={editingTask} courses={courses} onDone={() => setEditingTask(null)} />
        </Modal>
      )}
    </div>
  )
}
