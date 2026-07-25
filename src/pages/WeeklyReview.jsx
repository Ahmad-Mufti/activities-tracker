import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox as InboxIcon, FolderKanban, BrainCog, CalendarClock, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { todayLocalISO, addDays } from '../lib/dates'
import { minutesToLabel, getWeekBounds, computeProjectWeeklyConsumedMinutes } from '../lib/timeBudget'
import InboxList from '../components/InboxList'

const STEPS = [
  { key: 'inbox', label: 'Inbox', icon: InboxIcon },
  { key: 'proyek', label: 'Beban Proyek', icon: FolderKanban },
  { key: 'hafalan', label: 'Pace Hafalan', icon: BrainCog },
  { key: 'event', label: 'Pekan Depan', icon: CalendarClock },
]

function daysAgoLabel(iso) {
  if (!iso) return 'Belum pernah review'
  const diffMs = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Terakhir review hari ini'
  if (days === 1) return 'Terakhir review kemarin'
  return `Terakhir review ${days} hari lalu`
}

export default function WeeklyReview() {
  const navigate = useNavigate()
  const today = todayLocalISO()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastReviewAt, setLastReviewAt] = useState(null)
  const [projects, setProjects] = useState([])
  const [events, setEvents] = useState([])
  const [recurringEvents, setRecurringEvents] = useState([])
  const [plans, setPlans] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [hourInputs, setHourInputs] = useState({})
  const [paceInputs, setPaceInputs] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [done, setDone] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { weekStart, weekEnd } = getWeekBounds(today)
    const nextWeekStart = addDays(today, 1)
    const nextWeekEnd = addDays(today, 7)

    const [
      { data: settingsRow },
      { data: projectData },
      { data: eventData },
      { data: recurringData },
      { data: planData },
      { data: upcomingData },
    ] = await Promise.all([
      supabase.from('user_settings').select('last_review_at').maybeSingle(),
      supabase.from('projects').select('*').eq('status', 'active').not('weekly_hours', 'is', null),
      supabase.from('events').select('*').gte('event_date', weekStart).lte('event_date', weekEnd),
      supabase.from('recurring_events').select('*'),
      supabase.from('hafalan_plans').select('*'),
      supabase.from('events').select('*').gte('event_date', nextWeekStart).lte('event_date', nextWeekEnd).order('event_date'),
    ])

    setLastReviewAt(settingsRow?.last_review_at ?? null)
    setProjects(projectData ?? [])
    setEvents(eventData ?? [])
    setRecurringEvents(recurringData ?? [])
    setPlans((planData ?? []).filter((p) => p.total_units == null || p.current_position < p.total_units))
    setUpcomingEvents(upcomingData ?? [])
    setLoading(false)
  }, [today])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function saveProjectHours(project) {
    const raw = hourInputs[project.id]
    const value = raw === undefined ? project.weekly_hours : raw
    setSavingId(project.id)
    const { error } = await supabase
      .from('projects')
      .update({ weekly_hours: value === '' ? null : Number(value) })
      .eq('id', project.id)
    setSavingId(null)
    if (error) {
      alert(error.message)
      return
    }
    fetchAll()
  }

  async function savePlanPace(plan) {
    const raw = paceInputs[plan.id]
    const value = raw === undefined ? plan.daily_pace : raw
    if (Number(value) <= 0) {
      alert('Pace harus lebih dari 0.')
      return
    }
    setSavingId(plan.id)
    const { error } = await supabase.from('hafalan_plans').update({ daily_pace: Number(value) }).eq('id', plan.id)
    setSavingId(null)
    if (error) {
      alert(error.message)
      return
    }
    fetchAll()
  }

  async function finishReview() {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ last_review_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) {
      alert(error.message)
      return
    }
    setDone(true)
  }

  if (loading) {
    return <p className="text-gray-400">Memuat...</p>
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-4xl">🎉</p>
          <h1 className="mt-2 text-xl font-semibold text-gray-800">Weekly review selesai</h1>
          <p className="mt-1 text-sm text-gray-500">
            Semua sudah dicek. Sampai jumpa review minggu depan — tanpa beban, cukup santai saja.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  const current = STEPS[step]

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-gray-800">Weekly Review</h1>
      <p className="mt-1 text-sm text-gray-500">{daysAgoLabel(lastReviewAt)} — ±5 menit, santai saja.</p>

      <div className="mt-4 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-gray-400">
        Langkah {step + 1} dari {STEPS.length}: {current.label}
      </p>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
        {current.key === 'inbox' && (
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <InboxIcon size={16} /> Bersihkan Inbox
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Pilah catatan cepat yang menumpuk jadi tugas, event, atau kebiasaan — atau hapus yang tidak relevan
              lagi.
            </p>
            <div className="mt-3">
              <InboxList emptyMessage="Inbox sudah bersih. 🎉" />
            </div>
          </div>
        )}

        {current.key === 'proyek' && (
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FolderKanban size={16} /> Beban Mingguan Proyek Masih Akurat?
            </p>
            <p className="mt-1 text-xs text-gray-400">
              `weekly_hours` adalah tebakan — koreksi kalau realitanya beda dari rencana.
            </p>
            {projects.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">Tidak ada proyek dengan beban mingguan aktif.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {projects.map((p) => {
                  const { weekStart, weekEnd } = getWeekBounds(today)
                  const consumedMin = computeProjectWeeklyConsumedMinutes(p.id, events, recurringEvents, weekStart, weekEnd)
                  return (
                    <div key={p.id} className="rounded-lg bg-gray-50 p-3">
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">Terpakai minggu ini: {minutesToLabel(consumedMin)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={hourInputs[p.id] ?? p.weekly_hours ?? ''}
                          onChange={(e) => setHourInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                        />
                        <span className="text-xs text-gray-500">jam/minggu</span>
                        <button
                          onClick={() => saveProjectHours(p)}
                          disabled={savingId === p.id}
                          className="ml-auto flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Check size={12} /> Simpan
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {current.key === 'hafalan' && (
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <BrainCog size={16} /> Pace Hafalan Masih Realistis?
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Kalau terasa berat atau kelonggaran, sesuaikan pace harian — tanpa mengubah muraja'ah yang sudah
              berjalan.
            </p>
            {plans.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">Tidak ada rencana hafalan yang masih berjalan.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-800">{plan.name}</p>
                    <p className="text-xs text-gray-400">
                      {plan.current_position} / {plan.total_units} {plan.unit_label}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={paceInputs[plan.id] ?? plan.daily_pace ?? ''}
                        onChange={(e) => setPaceInputs((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                        className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                      />
                      <span className="text-xs text-gray-500">{plan.unit_label}/hari</span>
                      <button
                        onClick={() => savePlanPace(plan)}
                        disabled={savingId === plan.id}
                        className="ml-auto flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Check size={12} /> Simpan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {current.key === 'event' && (
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <CalendarClock size={16} /> Event Pekan Depan
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Cek dulu apa yang sudah tercatat — tambah yang belum lewat halaman Jadwal.
            </p>
            {upcomingEvents.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">Belum ada event tercatat untuk 7 hari ke depan.</p>
            ) : (
              <div className="mt-3 space-y-1.5">
                {upcomingEvents.map((ev) => (
                  <div key={ev.id} className="rounded-lg bg-gray-50 p-2 text-sm">
                    <p className="font-medium text-gray-800">{ev.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(ev.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {!ev.all_day && ev.start_time && ` · ${ev.start_time.slice(0, 5)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate('/jadwal')}
              className="mt-3 text-xs font-medium text-blue-600 hover:underline"
            >
              Buka halaman Jadwal untuk menambah event →
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          <ArrowLeft size={14} /> Kembali
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Lanjut <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={finishReview}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Check size={14} /> Selesai Review
          </button>
        )}
      </div>
    </div>
  )
}
