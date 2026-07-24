import { useCallback, useEffect, useState } from 'react'
import { ListTodo, CalendarPlus, Repeat, Trash2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useSemesters } from '../context/SemesterContext'
import { useConfirm } from '../context/ConfirmContext'
import Modal from '../components/Modal'
import TaskForm from '../components/TaskForm'
import EventForm from '../components/EventForm'
import HabitForm from '../components/HabitForm'

export default function Inbox() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const { activeSemester } = useSemesters()
  const [items, setItems] = useState([])
  const [courses, setCourses] = useState([])
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pilah, setPilah] = useState(null) // { item, type: 'task'|'event'|'habit' }

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('inbox_items')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
    if (!error) setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('inbox-items-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inbox_items', filter: `user_id=eq.${user.id}` },
        fetchItems,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchItems])

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (!error) setCategories(data)
      })
  }, [])

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

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'active')
      .then(({ data, error }) => {
        if (!error) setProjects(data)
      })
  }, [])

  async function markProcessed(item) {
    const { error } = await supabase.from('inbox_items').update({ processed: true }).eq('id', item.id)
    if (error) {
      alert(error.message)
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  async function handleDelete(item) {
    const ok = await confirm({
      title: 'Hapus catatan?',
      message: `Hapus catatan "${item.content}"?`,
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('inbox_items').delete().eq('id', item.id)
    if (error) {
      alert(error.message)
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Inbox</h1>
      <p className="mt-1 text-sm text-gray-500">
        Catatan cepat yang belum dipilah. Pilah tiap item jadi tugas, event, atau kebiasaan — atau hapus.
      </p>

      <div className="mt-4 space-y-2">
        {loading && <p className="text-gray-400">Memuat...</p>}
        {!loading && items.length === 0 && (
          <p className="text-gray-400">Inbox kosong. Semua catatan sudah dipilah. 🎉</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-sm text-gray-800">{item.content}</p>
            <p className="mt-0.5 text-xs text-gray-400">
              {new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setPilah({ item, type: 'task' })}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <ListTodo size={14} /> Jadi Tugas
              </button>
              <button
                onClick={() => setPilah({ item, type: 'event' })}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <CalendarPlus size={14} /> Jadi Event
              </button>
              <button
                onClick={() => setPilah({ item, type: 'habit' })}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Repeat size={14} /> Jadi Kebiasaan
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {pilah?.type === 'task' && (
        <Modal title="Jadi Tugas" onClose={() => setPilah(null)}>
          <TaskForm
            task={{ title: pilah.item.content }}
            courses={courses}
            projects={projects}
            onDone={() => {
              markProcessed(pilah.item)
              setPilah(null)
            }}
          />
        </Modal>
      )}
      {pilah?.type === 'event' && (
        <Modal title="Jadi Event" onClose={() => setPilah(null)}>
          <EventForm
            event={{ title: pilah.item.content }}
            projects={projects}
            onDone={() => {
              markProcessed(pilah.item)
              setPilah(null)
            }}
          />
        </Modal>
      )}
      {pilah?.type === 'habit' && (
        <Modal title="Jadi Kebiasaan" onClose={() => setPilah(null)}>
          <HabitForm
            habit={{ name: pilah.item.content }}
            categories={categories}
            onDone={() => {
              markProcessed(pilah.item)
              setPilah(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}
