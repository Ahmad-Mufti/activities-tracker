import { useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useSemesters } from '../context/SemesterContext'
import { todayLocalISO, isoDayOfWeek } from '../lib/dates'

const CHECK_INTERVAL_MS = 60 * 1000
const COURSE_REMINDER_MINUTES = 15
const TASK_REMINDER_HOURS = 3
const SUPPORTED = typeof window !== 'undefined' && 'Notification' in window

// Pengingat foreground: cuma jalan selagi tab app ini terbuka (bukan push notification
// sungguhan yang bisa nyampai walau app tertutup — itu butuh server terpisah).
export function useNotificationReminders() {
  const { activeSemester } = useSemesters()
  const notifiedRef = useRef(new Set())

  useEffect(() => {
    if (!SUPPORTED) return

    async function checkReminders() {
      if (Notification.permission !== 'granted') return

      const now = new Date()
      const today = todayLocalISO()
      const todayDow = isoDayOfWeek(now)

      if (activeSemester) {
        const { data: courses } = await supabase
          .from('courses')
          .select('*')
          .eq('semester_id', activeSemester.id)
          .eq('day_of_week', todayDow)

        for (const c of courses ?? []) {
          const key = `course-${c.id}-${today}`
          if (notifiedRef.current.has(key)) continue

          const [h, m] = c.start_time.split(':').map(Number)
          const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
          const minutesUntil = (startDateTime - now) / 60000

          if (minutesUntil >= 0 && minutesUntil <= COURSE_REMINDER_MINUTES) {
            new Notification('Jadwal akan mulai', {
              body: `${c.name} jam ${c.start_time.slice(0, 5)}${c.room ? ` di ${c.room}` : ''}`,
              tag: key,
            })
            notifiedRef.current.add(key)
          }
        }
      }

      const { data: tasks } = await supabase.from('tasks').select('*').neq('status', 'done').not('due_date', 'is', null)

      for (const t of tasks ?? []) {
        const key = `task-${t.id}`
        if (notifiedRef.current.has(key)) continue

        const hoursUntil = (new Date(t.due_date) - now) / 3600000
        if (hoursUntil >= 0 && hoursUntil <= TASK_REMINDER_HOURS) {
          new Notification('Tugas mendekati tenggat', {
            body: `"${t.title}" jatuh tempo ${new Date(t.due_date).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}`,
            tag: key,
          })
          notifiedRef.current.add(key)
        }
      }
    }

    checkReminders()
    const interval = setInterval(checkReminders, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [activeSemester])
}
