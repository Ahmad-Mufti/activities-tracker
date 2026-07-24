// Jadwal sholat lokal (offline) via adhan-js — SPEC.md Bagian 6D.
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan'
import { addDays, toLocalISO, fromLocalISO } from './dates'

export const PRAYER_LABELS = {
  fajr: 'Subuh',
  sunrise: 'Syuruq',
  dhuhr: 'Dzuhur',
  asr: 'Ashar',
  maghrib: 'Maghrib',
  isha: 'Isya',
}

export const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

// adhan-js tidak menyediakan metode 'KEMENAG' bawaan. Didekati dengan sudut
// yang umum dipakai aplikasi jadwal sholat Indonesia (Fajr 20°, Isha 18°).
function calculationParamsFor(calcMethod) {
  if (!calcMethod || calcMethod === 'KEMENAG') {
    const params = CalculationMethod.Other()
    params.fajrAngle = 20
    params.ishaAngle = 18
    return params
  }
  const factory = CalculationMethod[calcMethod]
  return factory ? factory() : CalculationMethod.Other()
}

export function computePrayerTimes({ latitude, longitude, calcMethod, date = new Date() }) {
  if (latitude == null || longitude == null) return null
  const coordinates = new Coordinates(Number(latitude), Number(longitude))
  return new PrayerTimes(coordinates, date, calculationParamsFor(calcMethod))
}

export function formatTime(date) {
  if (!date) return '--:--'
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function formatDuration(start, end) {
  if (!start || !end) return ''
  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60_000)
  if (totalMinutes <= 0) return '0 menit'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m} menit`
  if (m === 0) return `${h} jam`
  return `${h} jam ${m} menit`
}

// Sholat berikutnya, termasuk lintas hari (setelah Isya → Subuh besok).
export function getNextPrayer({ latitude, longitude, calcMethod }, now = new Date()) {
  const today = computePrayerTimes({ latitude, longitude, calcMethod, date: now })
  if (!today) return null

  const key = today.nextPrayer(now)
  if (key !== 'none') {
    return { key, label: PRAYER_LABELS[key], time: today.timeForPrayer(key) }
  }

  const tomorrow = computePrayerTimes({
    latitude,
    longitude,
    calcMethod,
    date: fromLocalISO(addDays(toLocalISO(now), 1)),
  })
  return { key: 'fajr', label: PRAYER_LABELS.fajr, time: tomorrow.fajr }
}

// Daftar statis slot (kunci + label) — dipakai dropdown pemilihan slot di form (tak butuh koordinat).
export const SLOT_OPTIONS = [
  { key: 'bada_subuh', label: "Ba'da Subuh" },
  { key: 'pagi', label: 'Pagi' },
  { key: 'bada_dzuhur', label: "Ba'da Dzuhur" },
  { key: 'sore', label: 'Sore' },
  { key: 'bada_maghrib', label: "Ba'da Maghrib" },
  { key: 'malam', label: 'Malam' },
]

// Batas slot dinamis (SPEC 6D) — dipakai anggaran waktu per-slot penuh di Fase 11.
export function computeSlotBoundaries({ latitude, longitude, calcMethod, sleepHours = 7, date = new Date() }) {
  const today = computePrayerTimes({ latitude, longitude, calcMethod, date })
  if (!today) return []

  const tomorrow = computePrayerTimes({
    latitude,
    longitude,
    calcMethod,
    date: fromLocalISO(addDays(toLocalISO(date), 1)),
  })
  const bedTime = new Date(tomorrow.fajr.getTime() - Number(sleepHours ?? 7) * 60 * 60 * 1000)

  return [
    { key: 'bada_subuh', label: "Ba'da Subuh", start: today.fajr, end: today.sunrise },
    { key: 'pagi', label: 'Pagi', start: today.sunrise, end: today.dhuhr },
    { key: 'bada_dzuhur', label: "Ba'da Dzuhur", start: today.dhuhr, end: today.asr },
    { key: 'sore', label: 'Sore', start: today.asr, end: today.maghrib },
    { key: 'bada_maghrib', label: "Ba'da Maghrib", start: today.maghrib, end: today.isha },
    { key: 'malam', label: 'Malam', start: today.isha, end: bedTime },
  ]
}
