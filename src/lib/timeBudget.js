// Mesin Anggaran Waktu Harian — SPEC.md Bagian 6C. Fungsi murni, tanpa akses Supabase,
// supaya bisa dipakai baik di Dashboard (hari ini) maupun EventForm (tanggal event, dampak lebih awal).
import { addDays, fromLocalISO, isoDayOfWeek, toLocalISO } from './dates'

export function timeToMinutes(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minutesToLabel(totalMinutes) {
  const sign = totalMinutes < 0 ? '-' : ''
  const abs = Math.round(Math.abs(totalMinutes))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h === 0) return `${sign}${m} menit`
  if (m === 0) return `${sign}${h} jam`
  return `${sign}${h} jam ${m} menit`
}

export function overlapMinutes(aStart, aEnd, bStart, bEnd) {
  const start = Math.max(aStart, bStart)
  const end = Math.min(aEnd, bEnd)
  return Math.max(0, end - start)
}

// Terapkan schedule_exceptions ke sebuah course untuk tanggal tertentu.
// Return null kalau batal, atau {startMin, endMin} (menit sejak 00:00) kalau ada/pindah.
export function getCourseOccurrence(course, dateISO, exceptions) {
  const ex = (exceptions ?? []).find((e) => e.course_id === course.id && e.exception_date === dateISO)
  if (ex?.type === 'cancelled') return null
  if (ex?.type === 'moved') {
    return { startMin: timeToMinutes(ex.new_start_time), endMin: timeToMinutes(ex.new_end_time) }
  }
  return { startMin: timeToMinutes(course.start_time), endMin: timeToMinutes(course.end_time) }
}

// Semua kuliah yang benar-benar terjadi pada dateISO (hari `dow`), sudah menerapkan exceptions.
export function resolveCoursesForDate(courses, exceptions, dow, dateISO) {
  return (courses ?? [])
    .filter((c) => c.day_of_week === dow)
    .map((c) => {
      const occ = getCourseOccurrence(c, dateISO, exceptions)
      return occ ? { course: c, ...occ } : null
    })
    .filter(Boolean)
}

export function computeCourseMinutes(courses, exceptions, dow, dateISO) {
  return resolveCoursesForDate(courses, exceptions, dow, dateISO).reduce(
    (sum, r) => sum + Math.max(0, r.endMin - r.startMin),
    0,
  )
}

export function computeRecurringEventMinutes(recurringEvents, dow, dateISO) {
  return (recurringEvents ?? [])
    .filter((r) => r.day_of_week === dow)
    .filter((r) => (!r.valid_from || r.valid_from <= dateISO) && (!r.valid_until || r.valid_until >= dateISO))
    .reduce((sum, r) => {
      const s = timeToMinutes(r.start_time)
      const e = timeToMinutes(r.end_time)
      if (s == null || e == null) return sum
      return sum + Math.max(0, e - s)
    }, 0)
}

// Event sepanjang hari (all_day) tak punya jam pasti — dikecualikan dari pengurangan menit
// (simplifikasi yang didokumentasikan; event itu tetap tercatat & tampil di UI seperti biasa).
export function computeEventMinutes(events, dateISO) {
  return (events ?? [])
    .filter((e) => e.event_date === dateISO && !e.all_day)
    .reduce((sum, e) => {
      const s = timeToMinutes(e.start_time)
      const eTime = timeToMinutes(e.end_time)
      if (s == null || eTime == null) return sum
      return sum + Math.max(0, eTime - s)
    }, 0)
}

// Senin..Minggu (konvensi isoDayOfWeek: 1=Senin..7=Minggu) yang memuat dateISO.
export function getWeekBounds(dateISO) {
  const dow = isoDayOfWeek(fromLocalISO(dateISO))
  const weekStart = addDays(dateISO, -(dow - 1))
  const weekEnd = addDays(weekStart, 6)
  return { weekStart, weekEnd }
}

function daysRemainingInWeekInclusive(dateISO, weekEnd) {
  let count = 0
  let cursor = dateISO
  while (cursor <= weekEnd) {
    count++
    cursor = addDays(cursor, 1)
  }
  return count
}

// Beban mingguan proyek (6C) — anti hitung-ganda: event/recurring_event ber-project_id
// memakan `sisa`, bukan ditambah di atas beban harian.
export function computeProjectWeeklyConsumedMinutes(projectId, events, recurringEvents, weekStart, weekEnd) {
  const eventMin = (events ?? [])
    .filter((e) => e.project_id === projectId && !e.all_day && e.event_date >= weekStart && e.event_date <= weekEnd)
    .reduce((sum, e) => {
      const s = timeToMinutes(e.start_time)
      const eTime = timeToMinutes(e.end_time)
      if (s == null || eTime == null) return sum
      return sum + Math.max(0, eTime - s)
    }, 0)

  let cursor = weekStart
  let recurMin = 0
  while (cursor <= weekEnd) {
    const dow = isoDayOfWeek(fromLocalISO(cursor))
    recurMin += (recurringEvents ?? [])
      .filter((r) => r.project_id === projectId && r.day_of_week === dow)
      .filter((r) => (!r.valid_from || r.valid_from <= cursor) && (!r.valid_until || r.valid_until >= cursor))
      .reduce((sum, r) => {
        const s = timeToMinutes(r.start_time)
        const e = timeToMinutes(r.end_time)
        if (s == null || e == null) return sum
        return sum + Math.max(0, e - s)
      }, 0)
    cursor = addDays(cursor, 1)
  }

  return eventMin + recurMin
}

export function computeProjectDailyLoad(projects, events, recurringEvents, dateISO) {
  const { weekStart, weekEnd } = getWeekBounds(dateISO)
  const daysLeft = daysRemainingInWeekInclusive(dateISO, weekEnd)

  return (projects ?? [])
    .filter((p) => p.status === 'active' && p.weekly_hours != null)
    .reduce((sum, p) => {
      const consumed = computeProjectWeeklyConsumedMinutes(p.id, events, recurringEvents, weekStart, weekEnd)
      const sisa = Math.max(0, Number(p.weekly_hours) * 60 - consumed)
      const loadPerDay = daysLeft > 0 ? sisa / daysLeft : 0
      return sum + loadPerDay
    }, 0)
}

// waktu_luang hari-X (6C) — mengembalikan total & rincian utk transparansi UI.
export function computeFreeMinutes({ dateISO, dow, sleepHours, courses, exceptions, recurringEvents, events, projects }) {
  const sleepMin = Number(sleepHours ?? 7) * 60
  const courseMin = computeCourseMinutes(courses, exceptions, dow, dateISO)
  const recurMin = computeRecurringEventMinutes(recurringEvents, dow, dateISO)
  const eventMin = computeEventMinutes(events, dateISO)
  const projectMin = computeProjectDailyLoad(projects, events, recurringEvents, dateISO)

  const free = 1440 - sleepMin - courseMin - recurMin - eventMin - projectMin
  return { free, sleepMin, courseMin, recurMin, eventMin, projectMin }
}

// total_rencana hari-X (6C): kebiasaan + baca + hafalan (setoran baru) + tugas rencana/deadline dekat.
export function computeTotalRencana({ habits, readingPlans, hafalanPlans, tasks, dateISO, isDayOff }) {
  const habitMin = (habits ?? []).reduce((sum, h) => sum + Number(h.est_duration_min ?? 0), 0)

  const readingMin = (readingPlans ?? [])
    .filter((p) => p.total_units == null || p.current_position < p.total_units)
    .reduce((sum, p) => sum + Number(p.est_duration_min ?? 0), 0)

  const hafalanMin = isDayOff
    ? 0
    : (hafalanPlans ?? [])
        .filter((p) => p.total_units == null || p.current_position < p.total_units)
        .reduce((sum, p) => sum + Number(p.est_duration_min ?? 0), 0)

  const besok = addDays(dateISO, 1)
  const taskMin = (tasks ?? [])
    .filter((t) => t.status !== 'done')
    .filter((t) => t.planned_for === dateISO || (t.due_date && toLocalISO(new Date(t.due_date)) <= besok))
    .reduce((sum, t) => sum + Number(t.est_duration_min ?? 0), 0)

  return habitMin + readingMin + hafalanMin + taskMin
}

// Pengecekan per-slot (6C + 6D): kapasitas slot dikurangi overlap kuliah/event, dibanding
// jumlah durasi item (habit/reading/hafalan/task) yang ditaruh di slot itu.
export function computeSlotUsage({ slotBoundaries, courses, exceptions, dow, dateISO, events, items }) {
  const resolvedCourses = resolveCoursesForDate(courses, exceptions, dow, dateISO)
  const resolvedEvents = (events ?? []).filter((e) => e.event_date === dateISO && !e.all_day)

  return (slotBoundaries ?? []).map((slot) => {
    if (!slot.start || !slot.end) {
      return { ...slot, capacityMin: 0, usedMin: 0, overloaded: false }
    }
    const startMin = slot.start.getHours() * 60 + slot.start.getMinutes()
    const endMin = slot.end.getHours() * 60 + slot.end.getMinutes()
    const capacityMin = Math.max(0, endMin - startMin)

    const courseOverlap = resolvedCourses.reduce(
      (sum, r) => sum + overlapMinutes(r.startMin, r.endMin, startMin, endMin),
      0,
    )
    const eventOverlap = resolvedEvents.reduce((sum, e) => {
      const s = timeToMinutes(e.start_time)
      const eTime = timeToMinutes(e.end_time)
      if (s == null || eTime == null) return sum
      return sum + overlapMinutes(s, eTime, startMin, endMin)
    }, 0)

    const remainingCapacity = Math.max(0, capacityMin - courseOverlap - eventOverlap)
    const usedMin = (items ?? [])
      .filter((it) => it.time_slot === slot.key)
      .reduce((sum, it) => sum + Number(it.est_duration_min ?? 0), 0)

    return { ...slot, capacityMin: remainingCapacity, usedMin, overloaded: usedMin > remainingCapacity }
  })
}
